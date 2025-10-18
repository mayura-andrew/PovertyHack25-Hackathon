package pathway

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/mayura-andrew/fastfinder/internal/core/llm"
	"github.com/mayura-andrew/fastfinder/internal/data/mongodb"
	"github.com/mayura-andrew/fastfinder/internal/data/neo4j"
	"github.com/mayura-andrew/fastfinder/internal/services/scraper"
	"go.uber.org/zap"
)

// Service handles education pathway business logic
type Service struct {
	neo4jClient    *neo4j.Client
	llmClient      *llm.Client
	youtubeService *scraper.YouTubeService
	cache          *mongodb.LearningRoadmapCache
	logger         *zap.Logger
}

// NewService creates a new pathway service
func NewService(neo4jClient *neo4j.Client, llmClient *llm.Client, youtubeService *scraper.YouTubeService, mongoClient *mongodb.Client, logger *zap.Logger) *Service {
	// Initialize cache
	cache := mongodb.NewLearningRoadmapCache(mongoClient, logger)

	return &Service{
		neo4jClient:    neo4jClient,
		llmClient:      llmClient,
		youtubeService: youtubeService,
		cache:          cache,
		logger:         logger,
	}
}

// GetAllInstitutes retrieves all education institutes
func (s *Service) GetAllInstitutes(ctx context.Context) ([]neo4j.Institute, error) {
	s.logger.Debug("Fetching all institutes")
	institutes, err := s.neo4jClient.GetAllInstitutes(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch institutes", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch institutes: %w", err)
	}
	s.logger.Info("Successfully fetched institutes", zap.Int("count", len(institutes)))
	return institutes, nil
}

// GetProgramsByInstitute retrieves programs for a specific institute
func (s *Service) GetProgramsByInstitute(ctx context.Context, instituteName string) ([]neo4j.ProgramDetails, error) {
	s.logger.Debug("Fetching programs for institute", zap.String("institute", instituteName))

	if instituteName == "" {
		return nil, fmt.Errorf("institute name is required")
	}

	programs, err := s.neo4jClient.GetProgramsByInstitute(ctx, instituteName)
	if err != nil {
		s.logger.Error("Failed to fetch programs", zap.String("institute", instituteName), zap.Error(err))
		return nil, fmt.Errorf("failed to fetch programs: %w", err)
	}

	s.logger.Info("Successfully fetched programs",
		zap.String("institute", instituteName),
		zap.Int("count", len(programs)))
	return programs, nil
}

// GetCareerPaths finds education paths based on qualifications
func (s *Service) GetCareerPaths(ctx context.Context, qualifications []string) ([]neo4j.EducationPath, error) {
	s.logger.Debug("Finding career paths", zap.Strings("qualifications", qualifications))

	if len(qualifications) == 0 {
		return nil, fmt.Errorf("at least one qualification is required")
	}

	paths, err := s.neo4jClient.GetCareerPaths(ctx, qualifications)
	if err != nil {
		s.logger.Error("Failed to find career paths", zap.Error(err))
		return nil, fmt.Errorf("failed to find career paths: %w", err)
	}

	s.logger.Info("Successfully found career paths",
		zap.Strings("qualifications", qualifications),
		zap.Int("count", len(paths)))
	return paths, nil
}

// GetProgramDetails retrieves detailed information about a program
func (s *Service) GetProgramDetails(ctx context.Context, programName string) (*neo4j.ProgramDetails, error) {
	s.logger.Debug("Fetching program details", zap.String("program", programName))

	if programName == "" {
		return nil, fmt.Errorf("program name is required")
	}

	details, err := s.neo4jClient.GetProgramDetails(ctx, programName)
	if err != nil {
		s.logger.Error("Failed to fetch program details",
			zap.String("program", programName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to fetch program details: %w", err)
	}

	s.logger.Info("Successfully fetched program details", zap.String("program", programName))
	return details, nil
}

// GetAllCareers retrieves all available careers
func (s *Service) GetAllCareers(ctx context.Context) ([]neo4j.Career, error) {
	s.logger.Debug("Fetching all careers")

	careers, err := s.neo4jClient.GetAllCareers(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch careers", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch careers: %w", err)
	}

	s.logger.Info("Successfully fetched careers", zap.Int("count", len(careers)))
	return careers, nil
}

// GetPathwayToCareer finds educational pathways to a specific career
func (s *Service) GetPathwayToCareer(ctx context.Context, careerTitle string) ([]neo4j.EducationPath, error) {
	s.logger.Debug("Finding pathways to career", zap.String("career", careerTitle))

	if careerTitle == "" {
		return nil, fmt.Errorf("career title is required")
	}

	paths, err := s.neo4jClient.GetPathwayToCareer(ctx, careerTitle)
	if err != nil {
		s.logger.Error("Failed to find career pathways",
			zap.String("career", careerTitle),
			zap.Error(err))
		return nil, fmt.Errorf("failed to find career pathways: %w", err)
	}

	s.logger.Info("Successfully found career pathways",
		zap.String("career", careerTitle),
		zap.Int("count", len(paths)))
	return paths, nil
}

// GetLearningRoadmapFast generates a learning roadmap WITHOUT videos for ultra-fast response
// Use this when you need immediate results and can fetch videos separately on the frontend
func (s *Service) GetLearningRoadmapFast(ctx context.Context, programName string) (*LearningRoadmapResponse, error) {
	s.logger.Debug("Generating FAST learning roadmap (no videos)", zap.String("program", programName))

	if programName == "" {
		return nil, fmt.Errorf("program name is required")
	}

	// Check cache first
	cachedData, found, err := s.cache.Get(ctx, programName)
	if err != nil {
		s.logger.Warn("Cache error, proceeding with generation",
			zap.String("program", programName),
			zap.Error(err))
	}

	if found && cachedData != nil {
		s.logger.Info("Returning cached learning roadmap",
			zap.String("program", programName),
			zap.String("source", "cache"))

		response, err := s.unmarshalCachedRoadmap(cachedData)
		if err == nil {
			return response, nil
		}
	}

	// Get program prerequisites from Neo4j
	prerequisites, err := s.getPrerequisites(ctx, programName)
	if err != nil {
		s.logger.Warn("Failed to fetch prerequisites, continuing",
			zap.String("program", programName),
			zap.Error(err))
		prerequisites = []string{}
	}

	// Generate learning roadmap using LLM (this is fast)
	roadmap, err := s.llmClient.GenerateLearningRoadmap(ctx, programName, prerequisites)
	if err != nil {
		s.logger.Error("Failed to generate learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to generate learning roadmap: %w", err)
	}

	// Build response WITHOUT videos
	response := &LearningRoadmapResponse{
		ProgramName:    roadmap.ProgramName,
		Overview:       roadmap.Overview,
		TotalDuration:  roadmap.TotalDuration,
		Prerequisites:  roadmap.Prerequisites,
		KeySkills:      roadmap.KeySkills,
		RecommendedFor: roadmap.RecommendedFor,
		Steps:          make([]LearningStepWithVideos, len(roadmap.LearningSteps)),
	}

	for i, step := range roadmap.LearningSteps {
		response.Steps[i] = LearningStepWithVideos{
			StepNumber:  step.StepNumber,
			Title:       step.Title,
			Description: step.Description,
			Topics:      step.Topics,
			Duration:    step.Duration,
			Difficulty:  step.Difficulty,
			Videos:      []scraper.Video{}, // Empty videos for fast response
		}
	}

	s.logger.Info("Successfully generated FAST learning roadmap (no videos)",
		zap.String("program", programName),
		zap.Int("steps", len(response.Steps)))

	return response, nil
}

// GetCompletePathway retrieves a complete educational pathway by department
func (s *Service) GetCompletePathway(ctx context.Context, department string) ([]neo4j.ProgramDetails, error) {
	s.logger.Debug("Fetching complete pathway", zap.String("department", department))

	if department == "" {
		return nil, fmt.Errorf("department is required")
	}

	programs, err := s.neo4jClient.GetCompletePathway(ctx, department)
	if err != nil {
		s.logger.Error("Failed to fetch complete pathway",
			zap.String("department", department),
			zap.Error(err))
		return nil, fmt.Errorf("failed to fetch complete pathway: %w", err)
	}

	s.logger.Info("Successfully fetched complete pathway",
		zap.String("department", department),
		zap.Int("count", len(programs)))
	return programs, nil
}

// GetPathwayByQualification retrieves pathways filtered by department and qualification
func (s *Service) GetPathwayByQualification(ctx context.Context, department string, qualification string) ([]neo4j.ProgramDetails, error) {
	s.logger.Debug("Fetching pathway by qualification",
		zap.String("department", department),
		zap.String("qualification", qualification))

	if department == "" {
		return nil, fmt.Errorf("department is required")
	}

	if qualification == "" {
		return nil, fmt.Errorf("qualification is required")
	}

	programs, err := s.neo4jClient.GetPathwayByQualification(ctx, department, qualification)
	if err != nil {
		s.logger.Error("Failed to fetch pathway by qualification",
			zap.String("department", department),
			zap.String("qualification", qualification),
			zap.Error(err))
		return nil, fmt.Errorf("failed to fetch pathway by qualification: %w", err)
	}

	s.logger.Info("Successfully fetched pathway by qualification",
		zap.String("department", department),
		zap.String("qualification", qualification),
		zap.Int("count", len(programs)))
	return programs, nil
}

// LearningRoadmapResponse represents the complete learning roadmap with videos
type LearningRoadmapResponse struct {
	ProgramName    string                   `json:"program_name"`
	Overview       string                   `json:"overview"`
	TotalDuration  string                   `json:"total_duration"`
	Prerequisites  []string                 `json:"prerequisites"`
	KeySkills      []string                 `json:"key_skills"`
	RecommendedFor string                   `json:"recommended_for"`
	Steps          []LearningStepWithVideos `json:"steps"`
}

// LearningStepWithVideos combines a learning step with related videos
type LearningStepWithVideos struct {
	StepNumber  int             `json:"step_number"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Topics      []string        `json:"topics"`
	Duration    string          `json:"duration"`
	Difficulty  string          `json:"difficulty"`
	Videos      []scraper.Video `json:"videos"`
}

// GetLearningRoadmap generates a personalized learning roadmap for a program
// with intelligent caching and concurrent video fetching for optimal performance
func (s *Service) GetLearningRoadmap(ctx context.Context, programName string) (*LearningRoadmapResponse, error) {
	s.logger.Debug("Generating learning roadmap", zap.String("program", programName))

	if programName == "" {
		return nil, fmt.Errorf("program name is required")
	}

	// PERFORMANCE OPTIMIZATION 1: Check cache first
	cachedData, found, err := s.cache.Get(ctx, programName)
	if err != nil {
		s.logger.Warn("Cache error, proceeding with generation",
			zap.String("program", programName),
			zap.Error(err))
	}

	if found && cachedData != nil {
		s.logger.Info("Returning cached learning roadmap",
			zap.String("program", programName),
			zap.String("source", "cache"))

		// Convert cached data back to response struct
		response, err := s.unmarshalCachedRoadmap(cachedData)
		if err != nil {
			s.logger.Error("Failed to unmarshal cached data, regenerating",
				zap.String("program", programName),
				zap.Error(err))
			// Continue to regeneration if cache data is corrupted
		} else {
			return response, nil
		}
	}

	// Cache miss - generate new roadmap
	s.logger.Info("Cache miss - generating new learning roadmap",
		zap.String("program", programName))

	// Step 1: Get program prerequisites from Neo4j
	prerequisites, err := s.getPrerequisites(ctx, programName)
	if err != nil {
		s.logger.Error("Failed to fetch prerequisites",
			zap.String("program", programName),
			zap.Error(err))
		// Continue with empty prerequisites
		prerequisites = []string{}
	}

	// Step 2: Generate learning roadmap using LLM
	roadmap, err := s.llmClient.GenerateLearningRoadmap(ctx, programName, prerequisites)
	if err != nil {
		s.logger.Error("Failed to generate learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to generate learning roadmap: %w", err)
	}

	// PERFORMANCE OPTIMIZATION 2: Fetch videos concurrently for all topics
	response := &LearningRoadmapResponse{
		ProgramName:    roadmap.ProgramName,
		Overview:       roadmap.Overview,
		TotalDuration:  roadmap.TotalDuration,
		Prerequisites:  roadmap.Prerequisites,
		KeySkills:      roadmap.KeySkills,
		RecommendedFor: roadmap.RecommendedFor,
		Steps:          make([]LearningStepWithVideos, len(roadmap.LearningSteps)),
	}

	// PERFORMANCE OPTIMIZATION: Use goroutines with controlled concurrency
	var wg sync.WaitGroup
	var mu sync.Mutex // Protect concurrent writes to response.Steps

	// Reduced semaphore - limit concurrent step processing to avoid overwhelming YouTube
	// and reduce total request time
	semaphore := make(chan struct{}, 3) // Max 3 concurrent step requests (was 5)

	// Add timeout for overall video fetching process
	videoCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	for i, step := range roadmap.LearningSteps {
		wg.Add(1)

		// Launch goroutine for each step
		go func(idx int, learningStep llm.LearningStep) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }() // Release semaphore

			// Check if context is still valid
			select {
			case <-videoCtx.Done():
				s.logger.Warn("Video fetching timed out for step",
					zap.Int("step", learningStep.StepNumber),
					zap.String("title", learningStep.Title))
				// Add step without videos
				mu.Lock()
				response.Steps[idx] = LearningStepWithVideos{
					StepNumber:  learningStep.StepNumber,
					Title:       learningStep.Title,
					Description: learningStep.Description,
					Topics:      learningStep.Topics,
					Duration:    learningStep.Duration,
					Difficulty:  learningStep.Difficulty,
					Videos:      []scraper.Video{},
				}
				mu.Unlock()
				return
			default:
			}

			// Fetch videos for all topics in this step
			videos := s.fetchVideosForTopics(videoCtx, learningStep.Topics)

			// Build step with videos
			stepWithVideos := LearningStepWithVideos{
				StepNumber:  learningStep.StepNumber,
				Title:       learningStep.Title,
				Description: learningStep.Description,
				Topics:      learningStep.Topics,
				Duration:    learningStep.Duration,
				Difficulty:  learningStep.Difficulty,
				Videos:      videos,
			}

			// Thread-safe write to response
			mu.Lock()
			response.Steps[idx] = stepWithVideos
			mu.Unlock()

		}(i, step)
	}

	// Wait for all goroutines to complete
	wg.Wait()

	// Count steps with videos
	stepsWithVideos := 0
	totalVideos := 0
	for _, step := range response.Steps {
		if len(step.Videos) > 0 {
			stepsWithVideos++
			totalVideos += len(step.Videos)
		}
	}

	s.logger.Info("Successfully generated learning roadmap with concurrent video fetching",
		zap.String("program", programName),
		zap.Int("total_steps", len(response.Steps)),
		zap.Int("steps_with_videos", stepsWithVideos),
		zap.Int("total_videos", totalVideos))

	// PERFORMANCE OPTIMIZATION 3: Cache the result for future requests (async)
	go s.cacheRoadmap(programName, response)

	return response, nil
}

// fetchVideosForTopics fetches videos for multiple topics with optimized concurrency
func (s *Service) fetchVideosForTopics(ctx context.Context, topics []string) []scraper.Video {
	var allVideos []scraper.Video
	var mu sync.Mutex
	var wg sync.WaitGroup

	// PERFORMANCE OPTIMIZATION: Limit videos per step to reduce scraping time
	maxVideosPerStep := 3 // Reduced from 2 per topic to 3 total per step
	if len(topics) > maxVideosPerStep {
		// If too many topics, select the first few
		topics = topics[:maxVideosPerStep]
	}

	// Create context with timeout for video fetching (don't let it hang)
	videoCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// Increased concurrency since we have fewer topics now
	semaphore := make(chan struct{}, 5) // Max 5 concurrent topic searches

	for _, topic := range topics {
		wg.Add(1)

		go func(t string) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Fetch only 1 video per topic to reduce scraping time
			videos, err := s.youtubeService.SearchVideos(videoCtx, t, 1)
			if err != nil {
				s.logger.Warn("Failed to fetch videos for topic",
					zap.String("topic", t),
					zap.Error(err))
				return
			}

			mu.Lock()
			allVideos = append(allVideos, videos...)
			mu.Unlock()
		}(topic)
	}

	wg.Wait()

	s.logger.Debug("Fetched videos for topics",
		zap.Int("topics_count", len(topics)),
		zap.Int("videos_count", len(allVideos)))

	return allVideos
}

// cacheRoadmap caches a learning roadmap asynchronously
func (s *Service) cacheRoadmap(programName string, response *LearningRoadmapResponse) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Convert response to map for caching
	data, err := s.marshalRoadmapForCache(response)
	if err != nil {
		s.logger.Error("Failed to marshal roadmap for caching",
			zap.String("program", programName),
			zap.Error(err))
		return
	}

	if err := s.cache.Set(ctx, programName, data); err != nil {
		s.logger.Error("Failed to cache learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
	}
}

// marshalRoadmapForCache converts response to map for MongoDB storage
func (s *Service) marshalRoadmapForCache(response *LearningRoadmapResponse) (map[string]interface{}, error) {
	// Convert to JSON and back to map (ensures proper serialization)
	jsonData, err := json.Marshal(response)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, err
	}

	return data, nil
}

// unmarshalCachedRoadmap converts cached map back to response struct
func (s *Service) unmarshalCachedRoadmap(data map[string]interface{}) (*LearningRoadmapResponse, error) {
	// Convert to JSON and back to struct
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var response LearningRoadmapResponse
	if err := json.Unmarshal(jsonData, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// getPrerequisites fetches prerequisites for a program from Neo4j
func (s *Service) getPrerequisites(ctx context.Context, programName string) ([]string, error) {
	// Query Neo4j for program prerequisites
	programs, err := s.neo4jClient.GetProgramsByInstitute(ctx, programName)
	if err != nil {
		return nil, err
	}

	if len(programs) == 0 {
		return []string{}, nil
	}

	// Extract prerequisite names from the first matching program
	prerequisites := make([]string, 0)
	if len(programs) > 0 && len(programs[0].Prerequisites) > 0 {
		for _, prereq := range programs[0].Prerequisites {
			prerequisites = append(prerequisites, prereq.Name)
		}
	}

	return prerequisites, nil
}

// Cache Management Methods

// InvalidateCache removes a specific program's cached roadmap
func (s *Service) InvalidateCache(ctx context.Context, programName string) error {
	return s.cache.Delete(ctx, programName)
}

// GetCacheStats returns cache statistics
func (s *Service) GetCacheStats(ctx context.Context) (map[string]interface{}, error) {
	return s.cache.GetStats(ctx)
}

// ClearAllCache clears all cached roadmaps (use with caution)
func (s *Service) ClearAllCache(ctx context.Context) error {
	return s.cache.Clear(ctx)
}

// RefreshCache regenerates and updates a cached roadmap
func (s *Service) RefreshCache(ctx context.Context, programName string) error {
	// Delete existing cache
	if err := s.cache.Delete(ctx, programName); err != nil {
		s.logger.Warn("Failed to delete cache before refresh",
			zap.String("program", programName),
			zap.Error(err))
	}

	// Regenerate roadmap (will be cached automatically)
	_, err := s.GetLearningRoadmap(ctx, programName)
	return err
}

// GetJobRoleDetails retrieves comprehensive details about a specific job role
func (s *Service) GetJobRoleDetails(ctx context.Context, roleName string, programContext string) (*llm.JobRoleDetails, error) {
	s.logger.Info("Fetching job role details",
		zap.String("role", roleName),
		zap.String("context", programContext))

	// Generate job role details using LLM
	jobDetails, err := s.llmClient.GenerateJobRoleDetails(ctx, roleName, programContext)
	if err != nil {
		s.logger.Error("Failed to generate job role details",
			zap.String("role", roleName),
			zap.Error(err))
		return nil, fmt.Errorf("failed to generate job role details: %w", err)
	}

	s.logger.Info("Successfully generated job role details",
		zap.String("role", roleName))

	return jobDetails, nil
}
