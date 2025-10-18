package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mayura-andrew/fastfinder/internal/api/routes"
	"github.com/mayura-andrew/fastfinder/internal/containers"
	"github.com/mayura-andrew/fastfinder/internal/core/config"
	"github.com/mayura-andrew/fastfinder/pkg/logger"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	if err := logger.Initialize(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	log := logger.MustGetLogger()
	log.Info("Starting PathwayLK API Server")

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration", zap.Error(err))
	}

	log.Info("Configuration loaded",
		zap.String("environment", cfg.Server.Environment),
		zap.Int("port", cfg.Server.Port))

	// Initialize container with all dependencies
	container, err := containers.NewContainer(cfg)
	if err != nil {
		log.Fatal("Failed to initialize container", zap.Error(err))
	}

	// Setup routes
	router := routes.SetupRoutes(container, cfg, log)

	// Create HTTP server
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	server := &http.Server{
		Addr:           addr,
		Handler:        router,
		ReadTimeout:    cfg.Server.ReadTimeout,
		WriteTimeout:   cfg.Server.WriteTimeout,
		IdleTimeout:    cfg.Server.IdleTimeout,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start server in a goroutine
	go func() {
		log.Info("Server starting",
			zap.String("address", addr),
			zap.String("environment", cfg.Server.Environment))

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	log.Info("Server started successfully", zap.String("address", addr))

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Server shutting down...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exited gracefully")
}
