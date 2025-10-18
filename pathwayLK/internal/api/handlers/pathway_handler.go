package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mayura-andrew/fastfinder/internal/services/pathway"
	"github.com/mayura-andrew/fastfinder/internal/services/scraper"
	"go.uber.org/zap"
)

// PathwayHandler handles education pathway requests
type PathwayHandler struct {
	service        *pathway.Service
	youtubeService *scraper.YouTubeService
	logger         *zap.Logger
}

// NewPathwayHandler creates a new pathway handler
func NewPathwayHandler(service *pathway.Service, youtubeService *scraper.YouTubeService, logger *zap.Logger) *PathwayHandler {
	return &PathwayHandler{
		service:        service,
		youtubeService: youtubeService,
		logger:         logger,
	}
}

// GetInstitutes handles GET /api/v1/pathway/institutes
func (h *PathwayHandler) GetInstitutes(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")

	h.logger.Info("Fetching all institutes", zap.String("request_id", requestID))

	institutes, err := h.service.GetAllInstitutes(ctx)
	if err != nil {
		h.logger.Error("Failed to fetch institutes",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch institutes",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       institutes,
		"count":      len(institutes),
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetProgramsByInstitute handles GET /api/v1/pathway/institutes/:name/programs
func (h *PathwayHandler) GetProgramsByInstitute(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	instituteName := c.Param("name")

	h.logger.Info("Fetching programs for institute",
		zap.String("request_id", requestID),
		zap.String("institute", instituteName))

	if instituteName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Institute name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	programs, err := h.service.GetProgramsByInstitute(ctx, instituteName)
	if err != nil {
		h.logger.Error("Failed to fetch programs",
			zap.String("request_id", requestID),
			zap.String("institute", instituteName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch programs",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       programs,
		"count":      len(programs),
		"institute":  instituteName,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetProgramDetails handles GET /api/v1/pathway/programs/:name
func (h *PathwayHandler) GetProgramDetails(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("name")

	h.logger.Info("Fetching program details",
		zap.String("request_id", requestID),
		zap.String("program", programName))

	if programName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Program name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	details, err := h.service.GetProgramDetails(ctx, programName)
	if err != nil {
		h.logger.Error("Failed to fetch program details",
			zap.String("request_id", requestID),
			zap.String("program", programName),
			zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{
			"success":    false,
			"error":      "Program not found",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       details,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetCareerPaths handles POST /api/v1/pathway/career-paths
func (h *PathwayHandler) GetCareerPaths(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")

	var request struct {
		Qualifications []string `json:"qualifications" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		h.logger.Warn("Invalid request body",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Invalid request: qualifications array is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	h.logger.Info("Finding career paths",
		zap.String("request_id", requestID),
		zap.Strings("qualifications", request.Qualifications))

	paths, err := h.service.GetCareerPaths(ctx, request.Qualifications)
	if err != nil {
		h.logger.Error("Failed to find career paths",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to find career paths",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"data":           paths,
		"count":          len(paths),
		"qualifications": request.Qualifications,
		"request_id":     requestID,
		"timestamp":      time.Now().UTC(),
	})
}

// GetAllCareers handles GET /api/v1/pathway/careers
func (h *PathwayHandler) GetAllCareers(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")

	h.logger.Info("Fetching all careers", zap.String("request_id", requestID))

	careers, err := h.service.GetAllCareers(ctx)
	if err != nil {
		h.logger.Error("Failed to fetch careers",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch careers",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       careers,
		"count":      len(careers),
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetPathwayToCareer handles GET /api/v1/pathway/careers/:title/pathways
func (h *PathwayHandler) GetPathwayToCareer(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	careerTitle := c.Param("title")

	h.logger.Info("Finding pathways to career",
		zap.String("request_id", requestID),
		zap.String("career", careerTitle))

	if careerTitle == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Career title is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	paths, err := h.service.GetPathwayToCareer(ctx, careerTitle)
	if err != nil {
		h.logger.Error("Failed to find career pathways",
			zap.String("request_id", requestID),
			zap.String("career", careerTitle),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to find career pathways",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       paths,
		"count":      len(paths),
		"career":     careerTitle,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetCompletePathway handles GET /api/v1/pathway/departments/:name/complete
func (h *PathwayHandler) GetCompletePathway(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	department := c.Param("name")

	h.logger.Info("Fetching complete pathway",
		zap.String("request_id", requestID),
		zap.String("department", department))

	if department == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Department name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	programs, err := h.service.GetCompletePathway(ctx, department)
	if err != nil {
		h.logger.Error("Failed to fetch complete pathway",
			zap.String("request_id", requestID),
			zap.String("department", department),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch complete pathway",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       programs,
		"count":      len(programs),
		"department": department,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetPathwayByQualification handles GET /api/v1/pathway/departments/:name/by-qualification
// Query params: qualification (string)
func (h *PathwayHandler) GetPathwayByQualification(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	department := c.Param("name")
	qualification := c.Query("qualification")

	h.logger.Info("Fetching pathway by qualification",
		zap.String("request_id", requestID),
		zap.String("department", department),
		zap.String("qualification", qualification))

	if department == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Department name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	if qualification == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Qualification parameter is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	programs, err := h.service.GetPathwayByQualification(ctx, department, qualification)
	if err != nil {
		h.logger.Error("Failed to fetch pathway by qualification",
			zap.String("request_id", requestID),
			zap.String("department", department),
			zap.String("qualification", qualification),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch pathway",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"data":          programs,
		"count":         len(programs),
		"department":    department,
		"qualification": qualification,
		"request_id":    requestID,
		"timestamp":     time.Now().UTC(),
	})
}

// GetLearningRoadmap handles GET /api/v1/pathway/programs/:name/learning-roadmap
func (h *PathwayHandler) GetLearningRoadmap(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("name")

	h.logger.Info("Fetching learning roadmap",
		zap.String("request_id", requestID),
		zap.String("program", programName))

	if programName == "" {
		h.logger.Warn("Program name is required",
			zap.String("request_id", requestID))
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Program name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	roadmap, err := h.service.GetLearningRoadmap(ctx, programName)
	if err != nil {
		h.logger.Error("Failed to generate learning roadmap",
			zap.String("request_id", requestID),
			zap.String("program", programName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to generate learning roadmap",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       roadmap,
		"program":    programName,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetLearningRoadmapFast handles GET /api/v1/pathway/programs/:name/learning-roadmap-fast
// Returns roadmap WITHOUT videos for ultra-fast response (2-3 seconds vs 15-30 seconds)
func (h *PathwayHandler) GetLearningRoadmapFast(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("name")

	h.logger.Info("Fetching FAST learning roadmap (no videos)",
		zap.String("request_id", requestID),
		zap.String("program", programName))

	if programName == "" {
		h.logger.Warn("Program name is required",
			zap.String("request_id", requestID))
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Program name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	roadmap, err := h.service.GetLearningRoadmapFast(ctx, programName)
	if err != nil {
		h.logger.Error("Failed to generate fast learning roadmap",
			zap.String("request_id", requestID),
			zap.String("program", programName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to generate learning roadmap",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       roadmap,
		"program":    programName,
		"mode":       "fast",
		"note":       "Videos excluded for faster response. Use /videos/:stepNumber endpoint to fetch videos for specific steps.",
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetVideosForStep handles GET /api/v1/pathway/programs/:name/steps/:stepNumber/videos
// Fetches videos for a specific learning step on-demand
func (h *PathwayHandler) GetVideosForStep(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("name")
	stepNumberStr := c.Param("stepNumber")

	h.logger.Info("Fetching videos for specific step",
		zap.String("request_id", requestID),
		zap.String("program", programName),
		zap.String("step", stepNumberStr))

	if programName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Program name is required",
		})
		return
	}

	// Get topics from query params (comma-separated string or array)
	topicsStr := c.Query("topics")
	if topicsStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Topics query parameter is required (comma-separated string)",
			"example": "/programs/Software%20Engineering/steps/1/videos?topics=Python,JavaScript,Git",
		})
		return
	}

	// Parse comma-separated topics
	topics := strings.Split(topicsStr, ",")
	cleanTopics := make([]string, 0)
	for _, t := range topics {
		trimmed := strings.TrimSpace(t)
		if trimmed != "" {
			cleanTopics = append(cleanTopics, trimmed)
		}
	}

	if len(cleanTopics) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "At least one topic is required",
		})
		return
	}

	// Limit to 3 topics max for performance
	if len(cleanTopics) > 3 {
		cleanTopics = cleanTopics[:3]
	}

	// Fetch videos for topics with timeout
	videoCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	var allVideos []interface{}
	for _, topic := range cleanTopics {
		videos, err := h.youtubeService.SearchVideos(videoCtx, topic, 1)
		if err != nil {
			h.logger.Warn("Failed to fetch videos for topic",
				zap.String("topic", topic),
				zap.Error(err))
			continue
		}

		for _, v := range videos {
			allVideos = append(allVideos, v)
		}
	}

	h.logger.Info("Video fetching for step completed",
		zap.String("request_id", requestID),
		zap.Int("topics_count", len(cleanTopics)),
		zap.Int("video_count", len(allVideos)))

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"data":        allVideos,
		"topics":      cleanTopics,
		"program":     programName,
		"step_number": stepNumberStr,
		"request_id":  requestID,
		"timestamp":   time.Now().UTC(),
	})
}

// Cache Management Endpoints

// GetCacheStats handles GET /api/v1/pathway/cache/stats
func (h *PathwayHandler) GetCacheStats(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")

	h.logger.Info("Fetching cache statistics", zap.String("request_id", requestID))

	stats, err := h.service.GetCacheStats(ctx)
	if err != nil {
		h.logger.Error("Failed to fetch cache stats",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch cache statistics",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       stats,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// InvalidateCache handles DELETE /api/v1/pathway/cache/:program
func (h *PathwayHandler) InvalidateCache(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("program")

	if programName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Program name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	h.logger.Info("Invalidating cache",
		zap.String("request_id", requestID),
		zap.String("program", programName))

	if err := h.service.InvalidateCache(ctx, programName); err != nil {
		h.logger.Error("Failed to invalidate cache",
			zap.String("request_id", requestID),
			zap.String("program", programName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to invalidate cache",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Cache invalidated successfully",
		"program":    programName,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// RefreshCache handles POST /api/v1/pathway/cache/:program/refresh
func (h *PathwayHandler) RefreshCache(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	programName := c.Param("program")

	if programName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Program name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	h.logger.Info("Refreshing cache",
		zap.String("request_id", requestID),
		zap.String("program", programName))

	if err := h.service.RefreshCache(ctx, programName); err != nil {
		h.logger.Error("Failed to refresh cache",
			zap.String("request_id", requestID),
			zap.String("program", programName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to refresh cache",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Cache refreshed successfully",
		"program":    programName,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// ClearAllCache handles DELETE /api/v1/pathway/cache (use with caution)
func (h *PathwayHandler) ClearAllCache(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")

	h.logger.Warn("Clearing all cache", zap.String("request_id", requestID))

	if err := h.service.ClearAllCache(ctx); err != nil {
		h.logger.Error("Failed to clear cache",
			zap.String("request_id", requestID),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to clear cache",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "All cache cleared successfully",
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}

// GetJobRoleDetails handles GET /api/v1/pathway/job-roles/:roleName
func (h *PathwayHandler) GetJobRoleDetails(c *gin.Context) {
	ctx := c.Request.Context()
	requestID := c.GetString("request_id")
	roleName := c.Param("roleName")
	programContext := c.Query("program")

	// URL decode the role name
	roleName = strings.ReplaceAll(roleName, "%20", " ")
	roleName = strings.ReplaceAll(roleName, "+", " ")

	h.logger.Info("Fetching job role details",
		zap.String("request_id", requestID),
		zap.String("role", roleName),
		zap.String("program", programContext))

	if roleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":    false,
			"error":      "Role name is required",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	// If no program context provided, use generic context
	if programContext == "" {
		programContext = "General career path"
	}

	jobDetails, err := h.service.GetJobRoleDetails(ctx, roleName, programContext)
	if err != nil {
		h.logger.Error("Failed to fetch job role details",
			zap.String("request_id", requestID),
			zap.String("role", roleName),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":    false,
			"error":      "Failed to fetch job role details",
			"request_id": requestID,
			"timestamp":  time.Now().UTC(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       jobDetails,
		"request_id": requestID,
		"timestamp":  time.Now().UTC(),
	})
}
