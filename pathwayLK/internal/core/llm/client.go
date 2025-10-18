package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/mayura-andrew/fastfinder/internal/core/config"
	"github.com/mayura-andrew/fastfinder/pkg/logger"
	"go.uber.org/zap"
	"google.golang.org/genai"
)

// Client represents a Gemini LLM client following best practices
type Client struct {
	genaiClient *genai.Client
	config      config.LLMConfig
	ctx         context.Context
	cancel      context.CancelFunc
	logger      *zap.Logger
}

// Default configuration constants
const (
	DefaultModel      = "gemini-2.5-pro"
	DefaultMaxTokens  = 4000
	DefaultTimeout    = 60 * time.Second
	HealthCheckPrompt = "Respond with 'OK' to confirm you are working."
)

type ExplanationRequest struct {
	Query         string   `json:"query"`
	ContextChunks []string `json:"context_chunks"`
}

// NewConceptAnalysis represents the analysis of a potentially new concept
type NewConceptAnalysis struct {
	ConceptName         string   `json:"concept_name"`
	Description         string   `json:"description"`
	SuggestedPrereqs    []string `json:"suggested_prerequisites"`
	SuggestedDifficulty int      `json:"suggested_difficulty"`
	SuggestedCategory   string   `json:"suggested_category"`
	Reasoning           string   `json:"reasoning"`
	IsLikelyNewConcept  bool     `json:"is_likely_new_concept"`
}

func NewClient(cfg config.LLMConfig) (*Client, error) {
	logger := logger.MustGetLogger()
	logger.Info("Initializing Gemini LLM client",
		zap.String("model", cfg.Model),
		zap.Bool("api_key_provided", cfg.APIKey != ""))

	ctx, cancel := context.WithCancel(context.Background())

	// Get API key with fallback priority
	apiKey := cfg.APIKey
	if apiKey == "" {
		apiKey = os.Getenv("GEMINI_API_KEY")
	}
	if apiKey == "" {
		apiKey = os.Getenv("GOOGLE_API_KEY")
	}
	if apiKey == "" {
		apiKey = os.Getenv("MLF_LLM_API_KEY")
	}
	if apiKey == "" {
		cancel()
		return nil, fmt.Errorf("Gemini API key not found. Set GEMINI_API_KEY, GOOGLE_API_KEY, or MLF_LLM_API_KEY environment variable")
	}

	// Initialize Gemini client with proper configuration
	genaiClient, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize Gemini client: %w", err)
	}

	client := &Client{
		genaiClient: genaiClient,
		config:      cfg,
		ctx:         ctx,
		cancel:      cancel,
		logger:      logger,
	}

	logger.Info("Gemini LLM client initialized successfully",
		zap.String("model", cfg.Model),
		zap.String("provider", "gemini"))

	return client, nil
}

func (c *Client) Provider() string {
	return "gemini"
}

func (c *Client) Model() string {
	model := c.config.Model
	if model == "" {
		return DefaultModel
	}
	return model
}

func (c *Client) IsHealthy(ctx context.Context) bool {
	healthCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	_, err := c.callGemini(healthCtx, "You are a health check assistant.", HealthCheckPrompt, 0.1)
	if err != nil {
		c.logger.Warn("Gemini health check failed", zap.Error(err))
		return false
	}
	return true
}

func (c *Client) callGemini(ctx context.Context, systemPrompt, userPrompt string, temperature float32) (string, error) {
	// Use configured model or fallback
	model := c.config.Model
	if model == "" {
		model = DefaultModel
	}

	// Create the full prompt combining system and user prompts
	fullPrompt := systemPrompt + "\n\n" + userPrompt

	// Create generation config with proper validation
	maxTokens := c.config.MaxTokens
	if maxTokens <= 0 {
		maxTokens = DefaultMaxTokens
	}

	config := &genai.GenerateContentConfig{
		Temperature:     &temperature,
		MaxOutputTokens: int32(maxTokens),
	}

	// Generate content with timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, DefaultTimeout)
	defer cancel()

	resp, err := c.genaiClient.Models.GenerateContent(timeoutCtx, model, genai.Text(fullPrompt), config)
	if err != nil {
		return "", fmt.Errorf("Gemini API call failed: %w", err)
	}

	// Validate response structure
	if resp == nil {
		return "", fmt.Errorf("received nil response from Gemini")
	}

	if len(resp.Candidates) == 0 {
		return "", fmt.Errorf("no candidates returned from Gemini")
	}

	candidate := resp.Candidates[0]
	if candidate.Content == nil {
		return "", fmt.Errorf("candidate has no content")
	}

	// Extract the text content
	var content strings.Builder
	for _, part := range candidate.Content.Parts {
		if part.Text != "" {
			content.WriteString(part.Text)
		}
	}

	result := strings.TrimSpace(content.String())
	if result == "" {
		return "", fmt.Errorf("no text content in Gemini response")
	}

	return result, nil
}

func (c *Client) isResponseTruncated(response string) bool {
	if len(response) == 0 {
		return true
	}

	// Check if response ends abruptly without proper punctuation
	lastChar := response[len(response)-1]
	if lastChar != '.' && lastChar != '!' && lastChar != '?' && lastChar != '\n' {
		return true
	}

	// Check for common truncation patterns
	truncationIndicators := []string{
		" and their",
		" is a",
		" we can",
		" the ",
		" this ",
	}

	for _, indicator := range truncationIndicators {
		if strings.HasSuffix(response, indicator) {
			return true
		}
	}

	return false
}

// LearningStep represents a step in a learning roadmap
type LearningStep struct {
	StepNumber  int      `json:"step_number"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Topics      []string `json:"topics"`
	Duration    string   `json:"duration"`
	Difficulty  string   `json:"difficulty"`
}

// LearningRoadmap represents a complete learning path for a program
type LearningRoadmap struct {
	ProgramName    string         `json:"program_name"`
	Overview       string         `json:"overview"`
	TotalDuration  string         `json:"total_duration"`
	Prerequisites  []string       `json:"prerequisites"`
	LearningSteps  []LearningStep `json:"learning_steps"`
	KeySkills      []string       `json:"key_skills"`
	RecommendedFor string         `json:"recommended_for"`
}

// GenerateLearningRoadmap generates a structured learning roadmap for a program
func (c *Client) GenerateLearningRoadmap(ctx context.Context, programName string, prerequisites []string) (*LearningRoadmap, error) {
	c.logger.Info("Generating learning roadmap",
		zap.String("program", programName),
		zap.Strings("prerequisites", prerequisites))

	systemPrompt := `You are an expert education advisor specializing in creating comprehensive learning roadmaps for Sri Lankan students pursuing higher education.

Your task is to create a detailed, step-by-step learning roadmap that helps students prepare for and succeed in their chosen program.

Format your response as a JSON object with this exact structure:
{
  "program_name": "Program name",
  "overview": "Brief overview of what students will learn",
  "total_duration": "Estimated total time (e.g., '6-8 months')",
  "prerequisites": ["List of prerequisites"],
  "learning_steps": [
    {
      "step_number": 1,
      "title": "Step title",
      "description": "What students will learn in this step",
      "topics": ["Topic 1", "Topic 2"],
      "duration": "Estimated time (e.g., '2-3 weeks')",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "key_skills": ["Skill 1", "Skill 2"],
  "recommended_for": "Who should follow this roadmap"
}

Focus on:
- Practical, actionable steps
- Free online resources (especially for Sri Lankan context)
- Progressive difficulty
- Real-world applications
- Local job market relevance`

	prerequisitesStr := "None specified"
	if len(prerequisites) > 0 {
		prerequisitesStr = strings.Join(prerequisites, ", ")
	}

	userPrompt := fmt.Sprintf(`Create a comprehensive learning roadmap for the following program:

Program: %s
Prerequisites: %s

Generate a complete learning roadmap with 5-8 progressive steps that will take a student from the prerequisites to being ready for this program.

Each step should:
1. Build on previous steps
2. Include specific topics to study
3. Have realistic time estimates
4. Indicate difficulty level
5. Focus on foundational concepts first

Return ONLY the JSON object, no additional text.`, programName, prerequisitesStr)

	response, err := c.callGemini(ctx, systemPrompt, userPrompt, 0.7)
	if err != nil {
		return nil, fmt.Errorf("failed to generate learning roadmap: %w", err)
	}

	// Clean the response (remove markdown code blocks if present)
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var roadmap LearningRoadmap
	if err := json.Unmarshal([]byte(response), &roadmap); err != nil {
		c.logger.Error("Failed to parse learning roadmap JSON",
			zap.Error(err),
			zap.String("response", response))
		return nil, fmt.Errorf("failed to parse learning roadmap: %w", err)
	}

	c.logger.Info("Successfully generated learning roadmap",
		zap.String("program", programName),
		zap.Int("steps", len(roadmap.LearningSteps)))

	return &roadmap, nil
}

// GenerateTopicsForStep generates specific learning topics for a step
func (c *Client) GenerateTopicsForStep(ctx context.Context, stepTitle string, programContext string) ([]string, error) {
	systemPrompt := `You are an educational content curator. Generate a list of 3-5 specific, searchable topics for learning.`

	userPrompt := fmt.Sprintf(`For a student learning "%s" as part of "%s", what are the key topics they should search for and study?

Provide topics that:
1. Are specific and searchable (good for YouTube/Khan Academy)
2. Build foundational understanding
3. Are beginner-friendly
4. Use common educational terminology

Return a JSON array of topic strings, like: ["Topic 1", "Topic 2", "Topic 3"]`, stepTitle, programContext)

	response, err := c.callGemini(ctx, systemPrompt, userPrompt, 0.5)
	if err != nil {
		return nil, fmt.Errorf("failed to generate topics: %w", err)
	}

	// Clean response
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var topics []string
	if err := json.Unmarshal([]byte(response), &topics); err != nil {
		c.logger.Warn("Failed to parse topics JSON, extracting manually",
			zap.Error(err))
		// Fallback: split by common delimiters
		topics = strings.Split(response, "\n")
	}

	return topics, nil
}

// JobRoleDetails represents comprehensive information about a specific job role
type JobRoleDetails struct {
	RoleName            string              `json:"role_name"`
	Overview            string              `json:"overview"`
	KeyResponsibilities []string            `json:"key_responsibilities"`
	RequiredSkills      SkillCategory       `json:"required_skills"`
	CareerPath          CareerPathInfo      `json:"career_path"`
	SalaryInfo          SalaryInfo          `json:"salary_info"`
	WorkEnvironment     WorkEnvironmentInfo `json:"work_environment"`
	GrowthOpportunities []string            `json:"growth_opportunities"`
	Certifications      []string            `json:"certifications"`
	DayInLife           []string            `json:"day_in_life"`
	LocalMarket         LocalMarketInfo     `json:"local_market"`
}

// SkillCategory represents different categories of skills
type SkillCategory struct {
	Technical []string `json:"technical"`
	Soft      []string `json:"soft"`
	Tools     []string `json:"tools"`
}

// CareerPathInfo represents career progression information
type CareerPathInfo struct {
	EntryLevel     string `json:"entry_level"`
	MidLevel       string `json:"mid_level"`
	SeniorLevel    string `json:"senior_level"`
	YearsToAdvance string `json:"years_to_advance"`
}

// SalaryInfo represents salary expectations
type SalaryInfo struct {
	EntryLevel  string `json:"entry_level"`
	MidLevel    string `json:"mid_level"`
	SeniorLevel string `json:"senior_level"`
	Currency    string `json:"currency"`
}

// WorkEnvironmentInfo represents work environment details
type WorkEnvironmentInfo struct {
	Type         string   `json:"type"`
	RemoteOption bool     `json:"remote_option"`
	Industries   []string `json:"industries"`
	CompanyTypes []string `json:"company_types"`
}

// LocalMarketInfo represents local job market information
type LocalMarketInfo struct {
	Demand           string   `json:"demand"`
	TopCompanies     []string `json:"top_companies"`
	GrowthProjection string   `json:"growth_projection"`
	KeyCities        []string `json:"key_cities"`
}

// GenerateJobRoleDetails generates comprehensive information about a specific job role
func (c *Client) GenerateJobRoleDetails(ctx context.Context, roleName string, programContext string) (*JobRoleDetails, error) {
	c.logger.Info("Generating job role details",
		zap.String("role", roleName),
		zap.String("context", programContext))

	systemPrompt := `You are an expert career advisor and industry analyst specializing in the Sri Lankan job market. Your expertise includes:
- In-depth knowledge of various career paths and job roles
- Understanding of skill requirements and professional development
- Awareness of local job market trends in Sri Lanka
- Insight into salary ranges and career progression
- Knowledge of work environments and company cultures

Your task is to provide comprehensive, accurate, and actionable information about specific job roles that will help students and job seekers make informed career decisions.

Focus on:
1. Practical, realistic expectations
2. Sri Lankan job market context
3. Actionable advice and clear pathways
4. Current industry trends and demands
5. Skills that are actually valued by employers`

	userPrompt := fmt.Sprintf(`Generate comprehensive details about the job role: "%s"

Context: This role is a potential career outcome for students completing "%s"

Provide detailed information in the following JSON structure:
{
  "role_name": "%s",
  "overview": "A comprehensive 2-3 sentence overview of what this role entails and why it's important",
  "key_responsibilities": [
    "Specific responsibility 1 (be detailed and practical)",
    "Specific responsibility 2",
    "Specific responsibility 3",
    "Specific responsibility 4",
    "Specific responsibility 5"
  ],
  "required_skills": {
    "technical": [
      "Technical skill 1 (be specific - e.g., 'Python programming' not just 'programming')",
      "Technical skill 2",
      "Technical skill 3",
      "Technical skill 4",
      "Technical skill 5"
    ],
    "soft": [
      "Soft skill 1 (e.g., 'Cross-functional team collaboration')",
      "Soft skill 2",
      "Soft skill 3",
      "Soft skill 4"
    ],
    "tools": [
      "Tool/Technology 1 (e.g., 'Git version control')",
      "Tool/Technology 2",
      "Tool/Technology 3",
      "Tool/Technology 4"
    ]
  },
  "career_path": {
    "entry_level": "Junior/Entry position title",
    "mid_level": "Mid-level position title (3-5 years)",
    "senior_level": "Senior position title (7+ years)",
    "years_to_advance": "Typical timeframe for progression (e.g., '3-5 years to mid-level, 7-10 years to senior')"
  },
  "salary_info": {
    "entry_level": "LKR 50,000 - 80,000 per month (or appropriate range for Sri Lanka)",
    "mid_level": "LKR 100,000 - 200,000 per month",
    "senior_level": "LKR 250,000 - 500,000 per month",
    "currency": "LKR"
  },
  "work_environment": {
    "type": "Office-based / Hybrid / Remote / Field work",
    "remote_option": true/false,
    "industries": ["Industry 1", "Industry 2", "Industry 3"],
    "company_types": ["Startups", "Tech Companies", "Multinationals", "Government", etc.]
  },
  "growth_opportunities": [
    "Specific growth opportunity 1 (e.g., 'Transition to technical leadership roles')",
    "Specific growth opportunity 2",
    "Specific growth opportunity 3",
    "Specific growth opportunity 4"
  ],
  "certifications": [
    "Relevant certification 1 with provider (e.g., 'AWS Certified Solutions Architect - Amazon')",
    "Relevant certification 2",
    "Relevant certification 3",
    "Relevant certification 4"
  ],
  "day_in_life": [
    "Morning activity (e.g., '9:00 AM - Review project tickets and plan daily tasks')",
    "Mid-morning activity",
    "Afternoon activity",
    "Late afternoon activity",
    "End of day activity"
  ],
  "local_market": {
    "demand": "High / Medium / Growing / Stable - with brief explanation",
    "top_companies": [
      "Company 1 hiring for this role in Sri Lanka",
      "Company 2",
      "Company 3",
      "Company 4",
      "Company 5"
    ],
    "growth_projection": "Brief projection for next 3-5 years in Sri Lanka",
    "key_cities": ["Colombo", "Other major cities with opportunities"]
  }
}

Important guidelines:
1. ALL salary ranges MUST be in Sri Lankan Rupees (LKR) and realistic for the local market
2. Company names should be actual companies operating in Sri Lanka
3. Be specific and practical - avoid generic statements
4. Focus on actionable information
5. Consider the Sri Lankan context for all recommendations
6. Ensure responsibilities are detailed and reflect actual day-to-day work
7. Skills should be specific and learnable
8. Certifications should be recognized and accessible

Return ONLY the JSON object, no additional text or markdown formatting.`, roleName, programContext, roleName)

	response, err := c.callGemini(ctx, systemPrompt, userPrompt, 0.6)
	if err != nil {
		return nil, fmt.Errorf("failed to generate job role details: %w", err)
	}

	// Clean the response (remove markdown code blocks if present)
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var jobDetails JobRoleDetails
	if err := json.Unmarshal([]byte(response), &jobDetails); err != nil {
		c.logger.Error("Failed to parse job role details JSON",
			zap.Error(err),
			zap.String("response", response[:min(500, len(response))]))
		return nil, fmt.Errorf("failed to parse job role details: %w", err)
	}

	c.logger.Info("Successfully generated job role details",
		zap.String("role", roleName),
		zap.Int("responsibilities", len(jobDetails.KeyResponsibilities)))

	return &jobDetails, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Close gracefully shuts down the client
func (c *Client) Close() error {
	c.logger.Info("Closing Gemini LLM client")

	// Cancel the context to clean up any ongoing operations
	if c.cancel != nil {
		c.cancel()
	}

	// Wait briefly for graceful shutdown
	time.Sleep(100 * time.Millisecond)

	c.logger.Info("Gemini LLM client closed successfully")
	return nil
}
