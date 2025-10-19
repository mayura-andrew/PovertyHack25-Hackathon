package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mayura-andrew/fastfinder/internal/containers"
	"go.uber.org/zap"
)

type Handler struct {
	container containers.Container
	validator *validator.Validate
	logger    *zap.Logger
	startTime time.Time
}

func NewHandler(container containers.Container, logger *zap.Logger) *Handler {
	validator := validator.New()

	return &Handler{
		container: container,
		validator: validator,
		logger:    logger,
		startTime: time.Now(),
	}
}

func (h *Handler) HealthCheck(c *gin.Context) {
	ctx := c.Request.Context()

	// Get health check from container
	healthStatus := h.container.HealthCheck(ctx)

	systemHealth := "healthy"
	for service, healthy := range healthStatus {
		if !healthy {
			systemHealth = "degraded"
			h.logger.Warn("Service unhealthy", zap.String("service", service))
		}
	}

	// Check if this is a detailed health check
	if c.Request.URL.Path == "/api/v1/health-detailed" {
		c.JSON(http.StatusOK, gin.H{
			"status":    systemHealth,
			"timestamp": time.Now().UTC(),
			"uptime":    time.Since(h.startTime).String(),
			"version":   "1.0.0",
			"services":  healthStatus,
		})
		return
	}

	// Simple health check
	statusCode := http.StatusOK
	if systemHealth == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, gin.H{
		"status":    systemHealth,
		"timestamp": time.Now().UTC(),
		"uptime":    time.Since(h.startTime).String(),
	})
}
