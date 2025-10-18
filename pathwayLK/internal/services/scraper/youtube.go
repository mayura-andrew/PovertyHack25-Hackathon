package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"go.uber.org/zap"
)

// Video represents a YouTube video with educational content
type Video struct {
	VideoID     string    `json:"video_id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Channel     string    `json:"channel"`
	Duration    string    `json:"duration"`
	ViewCount   int64     `json:"view_count"`
	PublishedAt time.Time `json:"published_at"`
	Thumbnail   string    `json:"thumbnail"`
	Description string    `json:"description"`
}

// YouTubeService provides YouTube video search and filtering
type YouTubeService struct {
	apiKey     string
	httpClient *http.Client
	logger     *zap.Logger
}

// NewYouTubeService creates a new YouTube scraper service with optimized HTTP client
func NewYouTubeService(apiKey string, logger *zap.Logger) *YouTubeService {
	return &YouTubeService{
		apiKey: apiKey, // Keep for backward compatibility, but not used
		httpClient: &http.Client{
			Timeout: 10 * time.Second, // Reduced timeout - fail fast
			Transport: &http.Transport{
				MaxIdleConns:          100,              // Increased connection pool
				MaxIdleConnsPerHost:   20,               // More connections to YouTube
				IdleConnTimeout:       90 * time.Second, // Keep connections alive longer
				TLSHandshakeTimeout:   5 * time.Second,  // Fast TLS handshake
				ExpectContinueTimeout: 1 * time.Second,
				DisableCompression:    false,
				DisableKeepAlives:     false, // Enable HTTP Keep-Alive for reuse
				ForceAttemptHTTP2:     true,  // Use HTTP/2 for better performance
			},
		},
		logger: logger,
	}
}

// SearchVideos searches for educational videos on a specific topic using web scraping
func (s *YouTubeService) SearchVideos(ctx context.Context, topic string, maxResults int) ([]Video, error) {
	s.logger.Info("searching YouTube videos",
		zap.String("topic", topic),
		zap.Int("max_results", maxResults))

	// Build query with educational filters
	query := s.buildEducationalQuery(topic)

	// Scrape YouTube search results
	videos, err := s.scrapeYouTubeSearch(ctx, query, maxResults)
	if err != nil {
		s.logger.Error("YouTube search failed", zap.Error(err))
		return nil, fmt.Errorf("failed to search YouTube: %w", err)
	}

	// Filter for quality content
	qualityVideos := s.filterQualityVideos(videos)

	s.logger.Info("YouTube search completed",
		zap.Int("total_found", len(videos)),
		zap.Int("quality_videos", len(qualityVideos)))

	return qualityVideos, nil
}

// buildEducationalQuery creates a search query optimized for educational content
func (s *YouTubeService) buildEducationalQuery(topic string) string {
	// Add educational keywords to improve results
	educationalKeywords := []string{
		"tutorial",
		"course",
		"learn",
		"explained",
	}

	// Combine topic with educational context
	return fmt.Sprintf("%s %s", topic, strings.Join(educationalKeywords[:2], " OR "))
}

// scrapeYouTubeSearch scrapes YouTube search results page with optimizations
func (s *YouTubeService) scrapeYouTubeSearch(ctx context.Context, query string, maxResults int) ([]Video, error) {
	// Add timeout to context if not already set
	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	searchURL := fmt.Sprintf("https://www.youtube.com/results?search_query=%s", url.QueryEscape(query))

	req, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Optimized headers to avoid blocking and enable faster responses
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br") // Enable compression
	req.Header.Set("Connection", "keep-alive")             // Enable Keep-Alive
	req.Header.Set("Cache-Control", "max-age=0")

	startTime := time.Now()
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	s.logger.Debug("YouTube HTTP request completed",
		zap.Duration("duration", time.Since(startTime)),
		zap.Int("status", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("YouTube returned status %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract ytInitialData from page
	var ytInitialData map[string]interface{}
	doc.Find("script").Each(func(i int, script *goquery.Selection) {
		content := script.Text()
		if strings.Contains(content, "var ytInitialData = ") {
			// Extract JSON data
			start := strings.Index(content, "var ytInitialData = ") + len("var ytInitialData = ")
			end := strings.Index(content[start:], "};")
			if end > 0 {
				jsonStr := content[start : start+end+1]
				if err := json.Unmarshal([]byte(jsonStr), &ytInitialData); err == nil {
					return
				}
			}
		}
	})

	// Extract video information
	videos := s.extractVideosFromYTData(ytInitialData, maxResults)

	s.logger.Info("scraped YouTube results",
		zap.Int("videos_found", len(videos)))

	return videos, nil
}

// extractVideosFromYTData extracts video information from YouTube's initial data
func (s *YouTubeService) extractVideosFromYTData(data map[string]interface{}, maxResults int) []Video {
	var videos []Video

	if data == nil {
		return videos
	}

	// Navigate YouTube's data structure
	contents, ok := data["contents"].(map[string]interface{})
	if !ok {
		return videos
	}

	twoCol, ok := contents["twoColumnSearchResultsRenderer"].(map[string]interface{})
	if !ok {
		return videos
	}

	primary, ok := twoCol["primaryContents"].(map[string]interface{})
	if !ok {
		return videos
	}

	sectionList, ok := primary["sectionListRenderer"].(map[string]interface{})
	if !ok {
		return videos
	}

	sectionContents, ok := sectionList["contents"].([]interface{})
	if !ok {
		return videos
	}

	for _, section := range sectionContents {
		if len(videos) >= maxResults {
			break
		}

		sectionMap, ok := section.(map[string]interface{})
		if !ok {
			continue
		}

		itemSection, ok := sectionMap["itemSectionRenderer"].(map[string]interface{})
		if !ok {
			continue
		}

		items, ok := itemSection["contents"].([]interface{})
		if !ok {
			continue
		}

		for _, item := range items {
			if len(videos) >= maxResults {
				break
			}

			itemMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}

			videoRenderer, ok := itemMap["videoRenderer"].(map[string]interface{})
			if !ok {
				continue
			}

			videoID := s.extractString(videoRenderer, "videoId")
			if videoID == "" {
				continue
			}

			title := s.extractTextFromRuns(videoRenderer["title"])
			if title == "" {
				continue
			}

			video := Video{
				VideoID:     videoID,
				Title:       title,
				URL:         fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID),
				Channel:     s.extractTextFromRuns(videoRenderer["ownerText"]),
				Duration:    s.extractTextFromAccessibility(videoRenderer["lengthText"]),
				ViewCount:   s.parseViewCount(s.extractTextFromRuns(videoRenderer["viewCountText"])),
				Thumbnail:   s.extractThumbnailURL(videoRenderer["thumbnail"]),
				Description: s.extractTextFromRuns(videoRenderer["descriptionSnippet"]),
				PublishedAt: s.parsePublishedTime(s.extractTextFromRuns(videoRenderer["publishedTimeText"])),
			}

			videos = append(videos, video)
		}
	}

	return videos
}

// extractTextFromRuns extracts text from YouTube's text run objects
func (s *YouTubeService) extractTextFromRuns(textObj interface{}) string {
	if textObj == nil {
		return ""
	}

	textMap, ok := textObj.(map[string]interface{})
	if !ok {
		return fmt.Sprintf("%v", textObj)
	}

	if runs, ok := textMap["runs"].([]interface{}); ok {
		var text strings.Builder
		for _, run := range runs {
			if runMap, ok := run.(map[string]interface{}); ok {
				if runText, ok := runMap["text"].(string); ok {
					text.WriteString(runText)
				}
			}
		}
		return text.String()
	}

	if simpleText, ok := textMap["simpleText"].(string); ok {
		return simpleText
	}

	return ""
}

// extractTextFromAccessibility extracts text from accessibility objects
func (s *YouTubeService) extractTextFromAccessibility(textObj interface{}) string {
	if textObj == nil {
		return ""
	}

	textMap, ok := textObj.(map[string]interface{})
	if !ok {
		return s.extractTextFromRuns(textObj)
	}

	if accessibility, ok := textMap["accessibility"].(map[string]interface{}); ok {
		if accessData, ok := accessibility["accessibilityData"].(map[string]interface{}); ok {
			if label, ok := accessData["label"].(string); ok {
				return label
			}
		}
	}

	return s.extractTextFromRuns(textObj)
}

// extractString safely extracts string values
func (s *YouTubeService) extractString(data map[string]interface{}, key string) string {
	if value, ok := data[key].(string); ok {
		return value
	}
	return ""
}

// extractThumbnailURL extracts thumbnail URL from YouTube data
func (s *YouTubeService) extractThumbnailURL(thumbnailObj interface{}) string {
	if thumbnailObj == nil {
		return ""
	}

	thumbnailMap, ok := thumbnailObj.(map[string]interface{})
	if !ok {
		return ""
	}

	thumbnails, ok := thumbnailMap["thumbnails"].([]interface{})
	if !ok || len(thumbnails) == 0 {
		return ""
	}

	// Get the highest quality thumbnail (last one)
	lastThumbnail := thumbnails[len(thumbnails)-1]
	if thumbMap, ok := lastThumbnail.(map[string]interface{}); ok {
		if url, ok := thumbMap["url"].(string); ok {
			return url
		}
	}

	return ""
}

// parseViewCount parses view count string to integer
func (s *YouTubeService) parseViewCount(viewCountStr string) int64 {
	if viewCountStr == "" {
		return 0
	}

	// Remove "views" and other text, extract numbers
	re := regexp.MustCompile(`[\d,]+`)
	matches := re.FindAllString(viewCountStr, -1)

	if len(matches) == 0 {
		return 0
	}

	numStr := strings.ReplaceAll(matches[0], ",", "")
	if count, err := strconv.ParseInt(numStr, 10, 64); err == nil {
		return count
	}

	return 0
}

// parsePublishedTime parses relative time strings like "2 months ago"
func (s *YouTubeService) parsePublishedTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Now()
	}

	// Extract number and unit (e.g., "2 months ago" -> 2, "months")
	re := regexp.MustCompile(`(\d+)\s+(second|minute|hour|day|week|month|year)`)
	matches := re.FindStringSubmatch(strings.ToLower(timeStr))

	if len(matches) < 3 {
		return time.Now()
	}

	num, _ := strconv.Atoi(matches[1])
	unit := matches[2]

	now := time.Now()
	switch unit {
	case "second":
		return now.Add(-time.Duration(num) * time.Second)
	case "minute":
		return now.Add(-time.Duration(num) * time.Minute)
	case "hour":
		return now.Add(-time.Duration(num) * time.Hour)
	case "day":
		return now.AddDate(0, 0, -num)
	case "week":
		return now.AddDate(0, 0, -num*7)
	case "month":
		return now.AddDate(0, -num, 0)
	case "year":
		return now.AddDate(-num, 0, 0)
	}

	return now
}

// searchYouTubeAPI is deprecated but kept for backward compatibility
func (s *YouTubeService) searchYouTubeAPI(ctx context.Context, query string, maxResults int) ([]Video, error) {
	// This method is no longer used - redirects to web scraping
	return s.scrapeYouTubeSearch(ctx, query, maxResults)
}

// enrichVideoDetails is deprecated but kept for backward compatibility
func (s *YouTubeService) enrichVideoDetails(ctx context.Context, video *Video) error {
	// Video details are now extracted during scraping
	return nil
}

// filterQualityVideos filters videos based on quality metrics
func (s *YouTubeService) filterQualityVideos(videos []Video) []Video {
	const minViewCount = 1000 // Minimum views for quality content

	filtered := make([]Video, 0)
	for _, video := range videos {
		// Filter criteria:
		// 1. Must have reasonable view count
		// 2. Must be from past 3 years (recent content)
		// 3. Must have educational keywords in title

		if video.ViewCount < minViewCount {
			continue
		}

		age := time.Since(video.PublishedAt)
		if age > 3*365*24*time.Hour { // Older than 3 years
			continue
		}

		if s.hasEducationalKeywords(video.Title) {
			filtered = append(filtered, video)
		}
	}

	return filtered
}

// hasEducationalKeywords checks if title contains educational indicators
func (s *YouTubeService) hasEducationalKeywords(title string) bool {
	keywords := []string{
		"tutorial", "course", "learn", "explained", "introduction",
		"guide", "how to", "basics", "fundamentals", "complete",
		"beginner", "advanced", "master", "programming", "coding",
	}

	lowerTitle := strings.ToLower(title)
	for _, keyword := range keywords {
		if strings.Contains(lowerTitle, keyword) {
			return true
		}
	}

	return false
}

// GetVideosByTopics searches for videos across multiple topics
func (s *YouTubeService) GetVideosByTopics(ctx context.Context, topics []string, videosPerTopic int) (map[string][]Video, error) {
	results := make(map[string][]Video)

	for _, topic := range topics {
		videos, err := s.SearchVideos(ctx, topic, videosPerTopic)
		if err != nil {
			s.logger.Error("failed to search videos for topic",
				zap.String("topic", topic),
				zap.Error(err))
			continue
		}

		results[topic] = videos
	}

	return results, nil
}
