package neo4j

import (
	"context"
	"fmt"
	"time"

	"github.com/mayura-andrew/fastfinder/internal/core/config"
	"github.com/mayura-andrew/fastfinder/pkg/logger"
	"github.com/neo4j/neo4j-go-driver/v6/neo4j"
	neo4jConfig "github.com/neo4j/neo4j-go-driver/v6/neo4j/config"
	"go.uber.org/zap"
)

type Client struct {
	driver neo4j.Driver
	logger *zap.Logger
}

// Domain models for the education knowledge graph
type Institute struct {
	Name string `json:"name"`
}

type Faculty struct {
	Name string `json:"name"`
}

type Department struct {
	Name string `json:"name"`
}

type Program struct {
	Name string `json:"name"`
}

type Qualification struct {
	Name string `json:"name"`
}

type Career struct {
	Title string `json:"title"`
}

// Path represents a pathway from qualification to program to career
type EducationPath struct {
	Programs       []Program       `json:"programs"`
	Qualifications []Qualification `json:"qualifications"`
	Careers        []Career        `json:"careers"`
	Institute      string          `json:"institute"`
	Faculty        string          `json:"faculty"`
	Department     string          `json:"department"`
}

// ProgramDetails represents detailed information about a program
type ProgramDetails struct {
	Name          string          `json:"name"`
	Institute     string          `json:"institute"`
	Faculty       string          `json:"faculty"`
	Department    string          `json:"department"`
	Requirements  []Qualification `json:"requirements"`
	Prerequisites []Program       `json:"prerequisites"`
	CareerPaths   []Career        `json:"career_paths"`
}

type Concept struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
}

func NewClient(cfg config.Neo4jConfig) (*Client, error) {
	logger := logger.MustGetLogger()

	// Configure driver with proper timeouts and connection pooling
	driver, err := neo4j.NewDriver(
		cfg.URI,
		neo4j.BasicAuth(cfg.Username, cfg.Password, ""),
		func(c *neo4jConfig.Config) {
			// Connection pool settings
			c.MaxConnectionPoolSize = 50
			c.MaxConnectionLifetime = 1 * time.Hour
			c.ConnectionAcquisitionTimeout = 5 * time.Second

			// Socket connect timeout
			c.SocketConnectTimeout = 5 * time.Second
			c.SocketKeepalive = true
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}

	// Verify connectivity with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := driver.VerifyConnectivity(ctx); err != nil {
		driver.Close(ctx)
		return nil, fmt.Errorf("failed to verify Neo4j connectivity: %w", err)
	}

	logger.Info("Connected to Neo4j",
		zap.String("uri", cfg.URI),
		zap.Int("max_pool_size", 50),
		zap.Duration("connection_timeout", 5*time.Second))

	return &Client{
		driver: driver,
		logger: logger,
	}, nil
}

// Close closes the Neo4j driver
func (c *Client) Close(ctx context.Context) error {
	return c.driver.Close(ctx)
}

// GetAllInstitutes retrieves all institutes
func (c *Client) GetAllInstitutes(ctx context.Context) ([]Institute, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	result, err := session.Run(ctx, "MATCH (i:Institute) RETURN i.name as name ORDER BY i.name", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to query institutes: %w", err)
	}

	var institutes []Institute
	for result.Next(ctx) {
		record := result.Record()
		name, _ := record.Get("name")
		institutes = append(institutes, Institute{
			Name: name.(string),
		})
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating institutes: %w", err)
	}

	return institutes, nil
}

// GetProgramsByInstitute retrieves all programs offered by an institute
func (c *Client) GetProgramsByInstitute(ctx context.Context, instituteName string) ([]ProgramDetails, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (i:Institute {name: $instituteName})-[:HAS_FACULTY|OFFERS*]->(p:Program)
		OPTIONAL MATCH (i)-[:HAS_FACULTY]->(f:Faculty)-[:HAS_DEPARTMENT]->(d:Department)-[:OFFERS]->(p)
		OPTIONAL MATCH (p)-[:REQUIRES]->(q:Qualification)
		OPTIONAL MATCH (prereq:Program)-[:IS_PREREQUISITE_FOR]->(p)
		OPTIONAL MATCH (p)-[:LEADS_TO]->(c:Career)
		RETURN DISTINCT p.name as program, 
		       f.name as faculty, 
		       d.name as department,
		       COLLECT(DISTINCT q.name) as requirements,
		       COLLECT(DISTINCT prereq.name) as prerequisites,
		       COLLECT(DISTINCT c.title) as careers
		ORDER BY p.name
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"instituteName": instituteName,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query programs: %w", err)
	}

	var programs []ProgramDetails
	for result.Next(ctx) {
		record := result.Record()

		programName, _ := record.Get("program")
		faculty, _ := record.Get("faculty")
		department, _ := record.Get("department")
		requirements, _ := record.Get("requirements")
		prerequisites, _ := record.Get("prerequisites")
		careers, _ := record.Get("careers")

		details := ProgramDetails{
			Name:       programName.(string),
			Institute:  instituteName,
			Faculty:    stringOrEmpty(faculty),
			Department: stringOrEmpty(department),
		}

		// Convert requirements
		if reqList, ok := requirements.([]interface{}); ok {
			for _, req := range reqList {
				if reqStr, ok := req.(string); ok && reqStr != "" {
					details.Requirements = append(details.Requirements, Qualification{Name: reqStr})
				}
			}
		}

		// Convert prerequisites
		if preqList, ok := prerequisites.([]interface{}); ok {
			for _, preq := range preqList {
				if preqStr, ok := preq.(string); ok && preqStr != "" {
					details.Prerequisites = append(details.Prerequisites, Program{Name: preqStr})
				}
			}
		}

		// Convert careers
		if careerList, ok := careers.([]interface{}); ok {
			for _, career := range careerList {
				if careerStr, ok := career.(string); ok && careerStr != "" {
					details.CareerPaths = append(details.CareerPaths, Career{Title: careerStr})
				}
			}
		}

		programs = append(programs, details)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating programs: %w", err)
	}

	return programs, nil
}

// GetCareerPaths retrieves possible career paths based on qualifications
func (c *Client) GetCareerPaths(ctx context.Context, qualifications []string) ([]EducationPath, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (q:Qualification)
		WHERE q.name IN $qualifications
		MATCH (p:Program)-[:REQUIRES]->(q)
		OPTIONAL MATCH (i:Institute)-[:HAS_FACULTY|OFFERS*]->(p)
		OPTIONAL MATCH (f:Faculty)-[:HAS_DEPARTMENT]->(d:Department)-[:OFFERS]->(p)
		OPTIONAL MATCH (p)-[:LEADS_TO]->(c:Career)
		OPTIONAL MATCH (p)-[:REQUIRES]->(allReq:Qualification)
		RETURN DISTINCT p.name as program,
		       i.name as institute,
		       f.name as faculty,
		       d.name as department,
		       COLLECT(DISTINCT allReq.name) as allRequirements,
		       COLLECT(DISTINCT c.title) as careers
		ORDER BY p.name
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"qualifications": qualifications,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query career paths: %w", err)
	}

	var paths []EducationPath
	for result.Next(ctx) {
		record := result.Record()

		programName, _ := record.Get("program")
		institute, _ := record.Get("institute")
		faculty, _ := record.Get("faculty")
		department, _ := record.Get("department")
		requirements, _ := record.Get("allRequirements")
		careers, _ := record.Get("careers")

		path := EducationPath{
			Institute:  stringOrEmpty(institute),
			Faculty:    stringOrEmpty(faculty),
			Department: stringOrEmpty(department),
		}

		// Add program
		if progStr, ok := programName.(string); ok {
			path.Programs = append(path.Programs, Program{Name: progStr})
		}

		// Convert requirements
		if reqList, ok := requirements.([]interface{}); ok {
			for _, req := range reqList {
				if reqStr, ok := req.(string); ok && reqStr != "" {
					path.Qualifications = append(path.Qualifications, Qualification{Name: reqStr})
				}
			}
		}

		// Convert careers
		if careerList, ok := careers.([]interface{}); ok {
			for _, career := range careerList {
				if careerStr, ok := career.(string); ok && careerStr != "" {
					path.Careers = append(path.Careers, Career{Title: careerStr})
				}
			}
		}

		paths = append(paths, path)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating career paths: %w", err)
	}

	return paths, nil
}

// GetProgramDetails retrieves detailed information about a specific program
func (c *Client) GetProgramDetails(ctx context.Context, programName string) (*ProgramDetails, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (p:Program {name: $programName})
		OPTIONAL MATCH (i:Institute)-[:HAS_FACULTY|OFFERS*]->(p)
		OPTIONAL MATCH (f:Faculty)-[:HAS_DEPARTMENT]->(d:Department)-[:OFFERS]->(p)
		OPTIONAL MATCH (p)-[:REQUIRES]->(q:Qualification)
		OPTIONAL MATCH (prereq:Program)-[:IS_PREREQUISITE_FOR]->(p)
		OPTIONAL MATCH (p)-[:LEADS_TO]->(c:Career)
		RETURN p.name as program,
		       i.name as institute,
		       f.name as faculty,
		       d.name as department,
		       COLLECT(DISTINCT q.name) as requirements,
		       COLLECT(DISTINCT prereq.name) as prerequisites,
		       COLLECT(DISTINCT c.title) as careers
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"programName": programName,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query program details: %w", err)
	}

	if !result.Next(ctx) {
		return nil, fmt.Errorf("program not found: %s", programName)
	}

	record := result.Record()
	institute, _ := record.Get("institute")
	faculty, _ := record.Get("faculty")
	department, _ := record.Get("department")
	requirements, _ := record.Get("requirements")
	prerequisites, _ := record.Get("prerequisites")
	careers, _ := record.Get("careers")

	details := &ProgramDetails{
		Name:       programName,
		Institute:  stringOrEmpty(institute),
		Faculty:    stringOrEmpty(faculty),
		Department: stringOrEmpty(department),
	}

	// Convert requirements
	if reqList, ok := requirements.([]interface{}); ok {
		for _, req := range reqList {
			if reqStr, ok := req.(string); ok && reqStr != "" {
				details.Requirements = append(details.Requirements, Qualification{Name: reqStr})
			}
		}
	}

	// Convert prerequisites
	if preqList, ok := prerequisites.([]interface{}); ok {
		for _, preq := range preqList {
			if preqStr, ok := preq.(string); ok && preqStr != "" {
				details.Prerequisites = append(details.Prerequisites, Program{Name: preqStr})
			}
		}
	}

	// Convert careers
	if careerList, ok := careers.([]interface{}); ok {
		for _, career := range careerList {
			if careerStr, ok := career.(string); ok && careerStr != "" {
				details.CareerPaths = append(details.CareerPaths, Career{Title: careerStr})
			}
		}
	}

	return details, nil
}

// GetAllCareers retrieves all available careers
func (c *Client) GetAllCareers(ctx context.Context) ([]Career, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	result, err := session.Run(ctx, "MATCH (c:Career) RETURN c.title as title ORDER BY c.title", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to query careers: %w", err)
	}

	var careers []Career
	for result.Next(ctx) {
		record := result.Record()
		title, _ := record.Get("title")
		careers = append(careers, Career{
			Title: title.(string),
		})
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating careers: %w", err)
	}

	return careers, nil
}

// GetPathwayToCareer finds educational pathways to reach a specific career
func (c *Client) GetPathwayToCareer(ctx context.Context, careerTitle string) ([]EducationPath, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `
		MATCH (c:Career {title: $careerTitle})<-[:LEADS_TO]-(p:Program)
		OPTIONAL MATCH (i:Institute)-[:HAS_FACULTY|OFFERS*]->(p)
		OPTIONAL MATCH (f:Faculty)-[:HAS_DEPARTMENT]->(d:Department)-[:OFFERS]->(p)
		OPTIONAL MATCH (p)-[:REQUIRES]->(q:Qualification)
		OPTIONAL MATCH (prereq:Program)-[:IS_PREREQUISITE_FOR]->(p)
		RETURN DISTINCT p.name as program,
		       i.name as institute,
		       f.name as faculty,
		       d.name as department,
		       COLLECT(DISTINCT q.name) as requirements,
		       COLLECT(DISTINCT prereq.name) as prerequisites
		ORDER BY p.name
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"careerTitle": careerTitle,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query career pathways: %w", err)
	}

	var paths []EducationPath
	for result.Next(ctx) {
		record := result.Record()

		programName, _ := record.Get("program")
		institute, _ := record.Get("institute")
		faculty, _ := record.Get("faculty")
		department, _ := record.Get("department")
		requirements, _ := record.Get("requirements")
		prerequisites, _ := record.Get("prerequisites")

		path := EducationPath{
			Institute:  stringOrEmpty(institute),
			Faculty:    stringOrEmpty(faculty),
			Department: stringOrEmpty(department),
			Careers:    []Career{{Title: careerTitle}},
		}

		// Add program
		if progStr, ok := programName.(string); ok {
			path.Programs = append(path.Programs, Program{Name: progStr})
		}

		// Add prerequisites as programs too
		if preqList, ok := prerequisites.([]interface{}); ok {
			for _, preq := range preqList {
				if preqStr, ok := preq.(string); ok && preqStr != "" {
					path.Programs = append(path.Programs, Program{Name: preqStr})
				}
			}
		}

		// Convert requirements
		if reqList, ok := requirements.([]interface{}); ok {
			for _, req := range reqList {
				if reqStr, ok := req.(string); ok && reqStr != "" {
					path.Qualifications = append(path.Qualifications, Qualification{Name: reqStr})
				}
			}
		}

		paths = append(paths, path)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating career pathways: %w", err)
	}

	return paths, nil
}

// GetCompletePathway retrieves a complete educational pathway showing all levels
// from qualifications -> prerequisite programs -> degree programs -> careers
func (c *Client) GetCompletePathway(ctx context.Context, department string) ([]ProgramDetails, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	// Query to get all programs in a department including prerequisites
	query := `
		MATCH (d:Department {name: $department})-[:OFFERS]->(p:Program)
		OPTIONAL MATCH (p)-[:REQUIRES]->(q:Qualification)
		OPTIONAL MATCH (prereq:Program)-[:IS_PREREQUISITE_FOR]->(p)
		OPTIONAL MATCH (p)-[:LEADS_TO]->(c:Career)
		OPTIONAL MATCH (i:Institute)-[:HAS_FACULTY]->(f:Faculty)-[:HAS_DEPARTMENT]->(d)
		RETURN DISTINCT p.name as program,
		       i.name as institute,
		       f.name as faculty,
		       d.name as department,
		       COLLECT(DISTINCT q.name) as requirements,
		       COLLECT(DISTINCT prereq.name) as prerequisites,
		       COLLECT(DISTINCT c.title) as careers
		ORDER BY 
		  CASE 
		    WHEN p.name CONTAINS 'NVQ' THEN 1
		    WHEN p.name CONTAINS 'Certificate' THEN 2
		    WHEN p.name CONTAINS 'Bachelor' THEN 3
		    ELSE 4
		  END
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"department": department,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query complete pathway: %w", err)
	}

	var programs []ProgramDetails
	for result.Next(ctx) {
		record := result.Record()

		programName, _ := record.Get("program")
		institute, _ := record.Get("institute")
		faculty, _ := record.Get("faculty")
		dept, _ := record.Get("department")
		requirements, _ := record.Get("requirements")
		prerequisites, _ := record.Get("prerequisites")
		careers, _ := record.Get("careers")

		details := ProgramDetails{
			Name:       programName.(string),
			Institute:  stringOrEmpty(institute),
			Faculty:    stringOrEmpty(faculty),
			Department: stringOrEmpty(dept),
		}

		// Convert requirements
		if reqList, ok := requirements.([]interface{}); ok {
			for _, req := range reqList {
				if reqStr, ok := req.(string); ok && reqStr != "" {
					details.Requirements = append(details.Requirements, Qualification{Name: reqStr})
				}
			}
		}

		// Convert prerequisites
		if preqList, ok := prerequisites.([]interface{}); ok {
			for _, preq := range preqList {
				if preqStr, ok := preq.(string); ok && preqStr != "" {
					details.Prerequisites = append(details.Prerequisites, Program{Name: preqStr})
				}
			}
		}

		// Convert careers
		if careerList, ok := careers.([]interface{}); ok {
			for _, career := range careerList {
				if careerStr, ok := career.(string); ok && careerStr != "" {
					details.CareerPaths = append(details.CareerPaths, Career{Title: careerStr})
				}
			}
		}

		programs = append(programs, details)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating complete pathway: %w", err)
	}

	return programs, nil
}

// GetPathwayByQualification retrieves programs accessible from a specific qualification level
func (c *Client) GetPathwayByQualification(ctx context.Context, department string, qualification string) ([]ProgramDetails, error) {
	session := c.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	// This query finds all programs accessible from the given qualification
	// Strategy:
	// 1. Find programs that directly require the qualification
	// 2. Find programs reachable through prerequisite chains
	// 3. Order by educational progression
	query := `
		// Find the starting qualification
		MATCH (startQual:Qualification {name: $qualification})
		
		// Find departments that match the interest (e.g., "Engineering" matches "Civil Engineering")
		// and their offered programs
		MATCH (d:Department)-[:OFFERS]->(p:Program)
		WHERE d.name CONTAINS $department
		  AND (
		    // Check if program is accessible from the qualification
		    EXISTS {
		      MATCH (p)-[:REQUIRES]->(startQual)
		    }
		    OR EXISTS {
		      // Via prerequisite chain
		      MATCH (startProg:Program)-[:REQUIRES]->(startQual)
		      MATCH path = (startProg)-[:IS_PREREQUISITE_FOR*1..]->(p)
		    }
		    OR EXISTS {
		      // Via alternative qualification that's equivalent
		      MATCH (p)-[:REQUIRES]->(altQual:Qualification)
		      MATCH (bridgeProg:Program)-[:REQUIRES]->(startQual)
		      MATCH (bridgeProg)-[:IS_PREREQUISITE_FOR*0..]->(p)
		    }
		  )
		
		// Get institute and faculty info
		OPTIONAL MATCH (i:Institute)-[:HAS_FACULTY]->(f:Faculty)-[:HAS_DEPARTMENT]->(d)
		
		// Get all requirements for this program
		OPTIONAL MATCH (p)-[:REQUIRES]->(q:Qualification)
		
		// Get prerequisites
		OPTIONAL MATCH (prereq:Program)-[:IS_PREREQUISITE_FOR]->(p)
		
		// Get career paths
		OPTIONAL MATCH (p)-[:LEADS_TO]->(c:Career)
		
		// Calculate path distance from starting qualification
		OPTIONAL MATCH shortestPath = shortestPath((startProg:Program)-[:IS_PREREQUISITE_FOR*0..]->(p))
		WHERE (startProg)-[:REQUIRES]->(startQual) OR (p)-[:REQUIRES]->(startQual)
		
		WITH DISTINCT p, i, f, d, 
		     COLLECT(DISTINCT q.name) as requirements,
		     COLLECT(DISTINCT prereq.name) as prerequisites,
		     COLLECT(DISTINCT c.title) as careers,
		     COALESCE(LENGTH(shortestPath), 0) as pathDistance
		
		RETURN p.name as program,
		       i.name as institute,
		       f.name as faculty,
		       d.name as department,
		       requirements,
		       prerequisites,
		       careers
		ORDER BY 
		  pathDistance ASC,
		  CASE 
		    WHEN p.name CONTAINS 'NVQ Level 3' THEN 1
		    WHEN p.name CONTAINS 'NVQ Level 4' THEN 2
		    WHEN p.name CONTAINS 'Advanced Certificate' THEN 3
		    WHEN p.name CONTAINS 'Certificate' THEN 4
		    WHEN p.name CONTAINS 'Bachelor' THEN 5
		    WHEN p.name CONTAINS 'BSc' THEN 6
		    ELSE 7
		  END
	`

	result, err := session.Run(ctx, query, map[string]interface{}{
		"department":    department,
		"qualification": qualification,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query pathway by qualification: %w", err)
	}

	var programs []ProgramDetails
	for result.Next(ctx) {
		record := result.Record()

		programName, _ := record.Get("program")
		institute, _ := record.Get("institute")
		faculty, _ := record.Get("faculty")
		dept, _ := record.Get("department")
		requirements, _ := record.Get("requirements")
		prerequisites, _ := record.Get("prerequisites")
		careers, _ := record.Get("careers")

		details := ProgramDetails{
			Name:       programName.(string),
			Institute:  stringOrEmpty(institute),
			Faculty:    stringOrEmpty(faculty),
			Department: stringOrEmpty(dept),
		}

		// Convert requirements
		if reqList, ok := requirements.([]interface{}); ok {
			for _, req := range reqList {
				if reqStr, ok := req.(string); ok && reqStr != "" {
					details.Requirements = append(details.Requirements, Qualification{Name: reqStr})
				}
			}
		}

		// Convert prerequisites
		if preqList, ok := prerequisites.([]interface{}); ok {
			for _, preq := range preqList {
				if preqStr, ok := preq.(string); ok && preqStr != "" {
					details.Prerequisites = append(details.Prerequisites, Program{Name: preqStr})
				}
			}
		}

		// Convert careers
		if careerList, ok := careers.([]interface{}); ok {
			for _, career := range careerList {
				if careerStr, ok := career.(string); ok && careerStr != "" {
					details.CareerPaths = append(details.CareerPaths, Career{Title: careerStr})
				}
			}
		}

		programs = append(programs, details)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating pathway by qualification: %w", err)
	}

	return programs, nil
}

// IsHealthy checks if Neo4j connection is healthy
func (c *Client) IsHealthy(ctx context.Context) bool {
	err := c.driver.VerifyConnectivity(ctx)
	return err == nil
}

// Helper function to safely convert interface to string
func stringOrEmpty(val interface{}) string {
	if val == nil {
		return ""
	}
	if str, ok := val.(string); ok {
		return str
	}
	return ""
}
