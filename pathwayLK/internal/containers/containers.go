package containers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/mayura-andrew/fastfinder/internal/core/config"
	"github.com/mayura-andrew/fastfinder/internal/core/llm"
	"github.com/mayura-andrew/fastfinder/internal/data/mongodb"
	"github.com/mayura-andrew/fastfinder/internal/data/neo4j"
	"github.com/mayura-andrew/fastfinder/internal/services/pathway"
	"github.com/mayura-andrew/fastfinder/internal/services/scraper"
	"github.com/mayura-andrew/fastfinder/pkg/logger"
	"go.uber.org/zap"
)

type Container interface {
	PathwayService() *pathway.Service
	YouTubeService() *scraper.YouTubeService
	HealthCheck(ctx context.Context) map[string]bool
}

type AppContainer struct {
	config *config.Config
	logger *zap.Logger

	// Database clients
	mongoClient *mongodb.Client
	neo4jClient *neo4j.Client
	llmClient   *llm.Client

	// Services
	pathwayService *pathway.Service
	youtubeService *scraper.YouTubeService
}

func NewContainer(cfg *config.Config) (Container, error) {
	logger := logger.MustGetLogger()

	container := &AppContainer{
		config: cfg,
		logger: logger,
	}

	if err := container.initializeClients(); err != nil {
		return nil, fmt.Errorf("failed to initialize clients: %w", err)
	}

	logger.Info("Dependency injection container initialized successfully")
	return container, nil
}

func (c *AppContainer) initializeClients() error {
	// Use the enhanced initialization method with auth testing
	return c.initializeClientsEnhanced()
}

func (c *AppContainer) initializeClientsEnhanced() error {
	c.logger.Info("Initializing data clients with enhanced authentication")

	// Initialize MongoDB client with auth testing
	c.logger.Info("Initializing MongoDB client with authentication testing",
		zap.String("uri", maskMongoURI(c.config.MongoDB.URI)))

	mongoConfig := mongodb.Config{
		URI:            c.config.MongoDB.URI,
		Database:       c.config.MongoDB.Database,
		Username:       c.config.MongoDB.Username,
		Password:       c.config.MongoDB.Password,
		ConnectTimeout: c.config.MongoDB.ConnectTimeout,
		QueryTimeout:   30 * time.Second,
	}

	// Use the enhanced client that tests write permissions
	mongoClient, err := mongodb.NewClientWithAuthTest(mongoConfig)
	if err != nil {
		return fmt.Errorf("failed to initialize MongoDB client: %w", err)
	}
	c.mongoClient = mongoClient

	c.logger.Info("MongoDB client initialized successfully with verified write permissions")

	// Initialize Neo4j client
	c.logger.Info("Initializing Neo4j client", zap.String("uri", c.config.Neo4j.URI))
	neo4jClient, err := neo4j.NewClient(c.config.Neo4j)
	if err != nil {
		return fmt.Errorf("failed to initialize Neo4j client: %w", err)
	}
	c.neo4jClient = neo4jClient

	c.logger.Info("Neo4j client initialized successfully")

	// Initialize LLM client
	c.logger.Info("Initializing LLM client", zap.String("provider", c.config.LLM.Provider))

	llmClient, err := llm.NewClient(c.config.LLM)
	if err != nil {
		c.logger.Warn("Failed to initialize LLM client, learning roadmap feature will be disabled", zap.Error(err))
		// Don't fail the entire initialization, just disable LLM features
		llmClient = nil
	} else {
		c.logger.Info("LLM client initialized successfully")
	}
	c.llmClient = llmClient

	// Initialize YouTube service
	c.logger.Info("Initializing YouTube service")
	youtubeAPIKey := c.config.LLM.APIKey // Reusing API key config, you may want to add a separate field
	c.youtubeService = scraper.NewYouTubeService(youtubeAPIKey, c.logger)
	c.logger.Info("YouTube service initialized successfully")

	// c.logger.Info("LLM client initialized successfully")

	// Initialize services
	c.logger.Info("Initializing services")
	c.pathwayService = pathway.NewService(c.neo4jClient, c.llmClient, c.youtubeService, c.mongoClient, c.logger)
	c.logger.Info("Pathway service initialized successfully")

	c.logger.Info("All data clients initialized successfully with enhanced authentication")
	return nil
}

// PathwayService returns the pathway service
func (c *AppContainer) PathwayService() *pathway.Service {
	return c.pathwayService
}

// YouTubeService returns the YouTube scraping service
func (c *AppContainer) YouTubeService() *scraper.YouTubeService {
	return c.youtubeService
}

// HealthCheck checks the health of all services
func (c *AppContainer) HealthCheck(ctx context.Context) map[string]bool {
	health := make(map[string]bool)

	// Check MongoDB
	if c.mongoClient != nil {
		health["mongodb"] = c.mongoClient.Ping(ctx) == nil
	} else {
		health["mongodb"] = false
	}

	// Check Neo4j
	if c.neo4jClient != nil {
		health["neo4j"] = c.neo4jClient.IsHealthy(ctx)
	} else {
		health["neo4j"] = false
	}

	// Check LLM
	if c.llmClient != nil {
		health["llm"] = c.llmClient.IsHealthy(ctx)
	} else {
		health["llm"] = false
	}

	return health
}

// maskMongoURI masks sensitive information in MongoDB URIs for logging
func maskMongoURI(uri string) string {
	if strings.Contains(uri, "@") {
		parts := strings.Split(uri, "@")
		if len(parts) >= 2 && strings.Contains(parts[0], ":") {
			userParts := strings.Split(parts[0], ":")
			if len(userParts) >= 3 {
				userParts[len(userParts)-1] = "***"
				parts[0] = strings.Join(userParts, ":")
			}
		}
		return strings.Join(parts, "@")
	}
	return uri
}
