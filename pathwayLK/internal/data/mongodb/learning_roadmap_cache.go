package mongodb

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
)

const (
	// Cache collection name
	LearningRoadmapCollection = "learning_roadmaps"

	// Default cache TTL (7 days - roadmaps don't change frequently)
	DefaultCacheTTL = 7 * 24 * time.Hour
)

// CachedLearningRoadmap represents a cached learning roadmap in MongoDB
type CachedLearningRoadmap struct {
	ProgramName    string                 `bson:"program_name" json:"program_name"`
	Data           map[string]interface{} `bson:"data" json:"data"`
	CreatedAt      time.Time              `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time              `bson:"updated_at" json:"updated_at"`
	ExpiresAt      time.Time              `bson:"expires_at" json:"expires_at"`
	Version        int                    `bson:"version" json:"version"`
	HitCount       int64                  `bson:"hit_count" json:"hit_count"`
	LastAccessedAt time.Time              `bson:"last_accessed_at" json:"last_accessed_at"`
}

// LearningRoadmapCache handles caching operations for learning roadmaps
type LearningRoadmapCache struct {
	client     *Client
	collection *mongo.Collection
	logger     *zap.Logger
	cacheTTL   time.Duration
}

// NewLearningRoadmapCache creates a new learning roadmap cache
func NewLearningRoadmapCache(client *Client, logger *zap.Logger) *LearningRoadmapCache {
	collection := client.GetCollection(LearningRoadmapCollection)

	cache := &LearningRoadmapCache{
		client:     client,
		collection: collection,
		logger:     logger,
		cacheTTL:   DefaultCacheTTL,
	}

	// Initialize indexes in background
	go cache.ensureIndexes()

	return cache
}

// SetCacheTTL sets a custom cache TTL
func (c *LearningRoadmapCache) SetCacheTTL(ttl time.Duration) {
	c.cacheTTL = ttl
}

// ensureIndexes creates necessary indexes for optimal performance
func (c *LearningRoadmapCache) ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "program_name", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "expires_at", Value: 1}},
			Options: options.Index().
				SetExpireAfterSeconds(0). // TTL index - MongoDB auto-deletes expired docs
				SetName("ttl_index"),
		},
		{
			Keys: bson.D{
				{Key: "last_accessed_at", Value: -1},
			},
			Options: options.Index().SetName("last_accessed_idx"),
		},
		{
			Keys: bson.D{
				{Key: "hit_count", Value: -1},
			},
			Options: options.Index().SetName("hit_count_idx"),
		},
	}

	_, err := c.collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		c.logger.Error("Failed to create indexes for learning roadmap cache",
			zap.Error(err))
	} else {
		c.logger.Info("Learning roadmap cache indexes created successfully")
	}
}

// Get retrieves a cached learning roadmap
func (c *LearningRoadmapCache) Get(ctx context.Context, programName string) (map[string]interface{}, bool, error) {
	filter := bson.M{
		"program_name": programName,
		"expires_at":   bson.M{"$gt": time.Now()}, // Only get non-expired entries
	}

	var cached CachedLearningRoadmap
	err := c.collection.FindOne(ctx, filter).Decode(&cached)

	if err == mongo.ErrNoDocuments {
		c.logger.Debug("Cache miss for learning roadmap",
			zap.String("program", programName))
		return nil, false, nil
	}

	if err != nil {
		c.logger.Error("Failed to retrieve cached learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
		return nil, false, err
	}

	// Update hit count and last accessed time asynchronously
	go c.incrementHitCount(programName)

	c.logger.Info("Cache hit for learning roadmap",
		zap.String("program", programName),
		zap.Int64("hit_count", cached.HitCount),
		zap.Time("created_at", cached.CreatedAt))

	return cached.Data, true, nil
}

// Set stores a learning roadmap in the cache
func (c *LearningRoadmapCache) Set(ctx context.Context, programName string, data map[string]interface{}) error {
	now := time.Now()
	expiresAt := now.Add(c.cacheTTL)

	cached := CachedLearningRoadmap{
		ProgramName:    programName,
		Data:           data,
		CreatedAt:      now,
		UpdatedAt:      now,
		ExpiresAt:      expiresAt,
		Version:        1,
		HitCount:       0,
		LastAccessedAt: now,
	}

	filter := bson.M{"program_name": programName}
	update := bson.M{
		"$set": cached,
		"$setOnInsert": bson.M{
			"created_at": now,
		},
	}

	opts := options.Update().SetUpsert(true)
	result, err := c.collection.UpdateOne(ctx, filter, update, opts)

	if err != nil {
		c.logger.Error("Failed to cache learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
		return fmt.Errorf("failed to cache learning roadmap: %w", err)
	}

	if result.UpsertedCount > 0 {
		c.logger.Info("Learning roadmap cached (new entry)",
			zap.String("program", programName),
			zap.Time("expires_at", expiresAt))
	} else {
		c.logger.Info("Learning roadmap cache updated",
			zap.String("program", programName),
			zap.Time("expires_at", expiresAt))
	}

	return nil
}

// incrementHitCount updates hit statistics asynchronously
func (c *LearningRoadmapCache) incrementHitCount(programName string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"program_name": programName}
	update := bson.M{
		"$inc": bson.M{"hit_count": 1},
		"$set": bson.M{"last_accessed_at": time.Now()},
	}

	_, err := c.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.logger.Warn("Failed to increment hit count",
			zap.String("program", programName),
			zap.Error(err))
	}
}

// Delete removes a cached learning roadmap
func (c *LearningRoadmapCache) Delete(ctx context.Context, programName string) error {
	filter := bson.M{"program_name": programName}

	result, err := c.collection.DeleteOne(ctx, filter)
	if err != nil {
		c.logger.Error("Failed to delete cached learning roadmap",
			zap.String("program", programName),
			zap.Error(err))
		return fmt.Errorf("failed to delete cache entry: %w", err)
	}

	if result.DeletedCount > 0 {
		c.logger.Info("Deleted cached learning roadmap",
			zap.String("program", programName))
	}

	return nil
}

// InvalidateExpired manually removes expired cache entries (MongoDB TTL does this automatically)
func (c *LearningRoadmapCache) InvalidateExpired(ctx context.Context) (int64, error) {
	filter := bson.M{"expires_at": bson.M{"$lt": time.Now()}}

	result, err := c.collection.DeleteMany(ctx, filter)
	if err != nil {
		c.logger.Error("Failed to invalidate expired cache entries", zap.Error(err))
		return 0, err
	}

	if result.DeletedCount > 0 {
		c.logger.Info("Invalidated expired cache entries",
			zap.Int64("count", result.DeletedCount))
	}

	return result.DeletedCount, nil
}

// GetStats returns cache statistics
func (c *LearningRoadmapCache) GetStats(ctx context.Context) (map[string]interface{}, error) {
	// Total entries
	totalCount, err := c.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	// Active (non-expired) entries
	activeCount, err := c.collection.CountDocuments(ctx, bson.M{
		"expires_at": bson.M{"$gt": time.Now()},
	})
	if err != nil {
		return nil, err
	}

	// Most accessed programs
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"expires_at": bson.M{"$gt": time.Now()}}}},
		{{Key: "$sort", Value: bson.M{"hit_count": -1}}},
		{{Key: "$limit", Value: 10}},
		{{Key: "$project", Value: bson.M{
			"program_name": 1,
			"hit_count":    1,
			"created_at":   1,
		}}},
	}

	cursor, err := c.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var topPrograms []bson.M
	if err := cursor.All(ctx, &topPrograms); err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_entries":   totalCount,
		"active_entries":  activeCount,
		"expired_entries": totalCount - activeCount,
		"cache_ttl_hours": c.cacheTTL.Hours(),
		"top_programs":    topPrograms,
	}

	return stats, nil
}

// Clear removes all cache entries (use with caution)
func (c *LearningRoadmapCache) Clear(ctx context.Context) error {
	result, err := c.collection.DeleteMany(ctx, bson.M{})
	if err != nil {
		c.logger.Error("Failed to clear cache", zap.Error(err))
		return err
	}

	c.logger.Warn("Cache cleared",
		zap.Int64("deleted_count", result.DeletedCount))

	return nil
}

// RefreshTTL extends the expiration time for a cached entry
func (c *LearningRoadmapCache) RefreshTTL(ctx context.Context, programName string) error {
	filter := bson.M{"program_name": programName}
	update := bson.M{
		"$set": bson.M{
			"expires_at": time.Now().Add(c.cacheTTL),
			"updated_at": time.Now(),
		},
	}

	result, err := c.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("program not found in cache: %s", programName)
	}

	c.logger.Info("Refreshed cache TTL",
		zap.String("program", programName))

	return nil
}
