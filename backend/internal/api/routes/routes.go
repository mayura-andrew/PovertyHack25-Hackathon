package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mayura-andrew/fastfinder/internal/api/handlers"
	"github.com/mayura-andrew/fastfinder/internal/api/middleware"
	"github.com/mayura-andrew/fastfinder/internal/containers"
	"github.com/mayura-andrew/fastfinder/internal/core/config"

	"go.uber.org/zap"
)

func SetupRoutes(
	cont containers.Container,
	cfg *config.Config,
	logger *zap.Logger,
) *gin.Engine {
	// Set Gin mode based on environment
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(middleware.RequestID())
	router.Use(middleware.RequestLogger(logger))
	router.Use(middleware.Recovery(logger))
	router.Use(middleware.CORS())
	router.Use(middleware.SecurityHeaders())

	// Initialize handlers
	handler := handlers.NewHandler(cont, logger)
	pathwayHandler := handlers.NewPathwayHandler(cont.PathwayService(), cont.YouTubeService(), logger)

	// Health checks (no timeout)
	router.GET("/health", handler.HealthCheck)
	router.GET("/api/v1/health", handler.HealthCheck)
	router.GET("/api/v1/health-detailed", handler.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Pathway endpoints
		pathway := v1.Group("/pathway")
		{
			// Get all institutes
			pathway.GET("/institutes", pathwayHandler.GetInstitutes)

			// Get programs by institute
			pathway.GET("/institutes/:name/programs", pathwayHandler.GetProgramsByInstitute)

			// Get complete pathway by department
			pathway.GET("/departments/:name/complete", pathwayHandler.GetCompletePathway)

			// Get pathway by qualification (NEW)
			pathway.GET("/departments/:name/by-qualification", pathwayHandler.GetPathwayByQualification)

			// Get program details
			pathway.GET("/programs/:name", pathwayHandler.GetProgramDetails)

			// Get learning roadmap for a program (with videos - slower 15-30s)
			pathway.GET("/programs/:name/learning-roadmap", pathwayHandler.GetLearningRoadmap)

			// Get CACHED learning roadmap ONLY (no LLM call - instant if cached)
			pathway.GET("/programs/:name/learning-roadmap/cached", pathwayHandler.GetCachedLearningRoadmap)

			// Get learning roadmap FAST (without videos - ultra fast 2-3s)
			pathway.GET("/programs/:name/learning-roadmap-fast", pathwayHandler.GetLearningRoadmapFast)

			// Get videos for a specific step on-demand
			pathway.GET("/programs/:name/steps/:stepNumber/videos", pathwayHandler.GetVideosForStep)

			// Cache management endpoints
			cache := pathway.Group("/cache")
			{
				cache.GET("/stats", pathwayHandler.GetCacheStats)
				cache.DELETE("/:program", pathwayHandler.InvalidateCache)
				cache.POST("/:program/refresh", pathwayHandler.RefreshCache)
				cache.DELETE("", pathwayHandler.ClearAllCache) // Use with caution
			}

			// Job role details endpoint
			pathway.GET("/job-roles/:roleName", pathwayHandler.GetJobRoleDetails)

			// Get all careers
			pathway.GET("/careers", pathwayHandler.GetAllCareers)

			// Get pathways to a specific career
			pathway.GET("/careers/:title/pathways", pathwayHandler.GetPathwayToCareer)

			// Find career paths based on qualifications
			pathway.POST("/career-paths", pathwayHandler.GetCareerPaths)
		}
	}

	// Debug routes (only in development)
	if cfg.Server.Environment == "development" {
		debug := router.Group("/debug")
		{
			debug.GET("/config", func(c *gin.Context) {
				// Return sanitized config (without sensitive info)
				sanitizedCfg := *cfg
				sanitizedCfg.MongoDB.URI = maskSensitive(cfg.MongoDB.URI)
				sanitizedCfg.Neo4j.Password = "***"
				sanitizedCfg.LLM.APIKey = "***"
				sanitizedCfg.Weaviate.APIKey = "***"
				c.JSON(200, sanitizedCfg)
			})

			debug.GET("/health-check", func(c *gin.Context) {
				health := cont.HealthCheck(c.Request.Context())
				c.JSON(200, gin.H{
					"health_status": health,
					"all_healthy":   allHealthy(health),
				})
			})

			// Debug endpoint for pathway testing
			debug.GET("/pathway/test", func(c *gin.Context) {
				institutes, err := cont.PathwayService().GetAllInstitutes(c.Request.Context())
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}

				c.JSON(200, gin.H{
					"institutes": institutes,
					"count":      len(institutes),
					"timestamp":  time.Now(),
				})
			})
		}
	}

	return router
}

func maskSensitive(uri string) string {
	// Simple masking for URIs containing credentials
	if len(uri) > 20 {
		return uri[:10] + "***" + uri[len(uri)-7:]
	}
	return "***"
}

func allHealthy(health map[string]bool) bool {
	for _, healthy := range health {
		if !healthy {
			return false
		}
	}
	return true
}
