# Learning Roadmap Feature - Implementation Guide

## Overview

This feature adds AI-powered personalized learning roadmaps with curated YouTube video suggestions to help students prepare for their chosen programs. It leverages Gemini LLM to generate structured learning paths and YouTube Data API to find high-quality educational resources.

## Architecture

### Backend Components

#### 1. LLM Client (`pathwayLK/internal/core/llm/client.go`)

**Purpose**: Interface with Gemini AI to generate educational content

**Key Methods**:
- `GenerateLearningRoadmap(ctx, programName, prerequisites)`: Creates a complete learning path
  - Returns: Program overview, total duration, learning steps, key skills, prerequisites
  - Uses Gemini 1.5 Flash model with JSON response format
  - Prompt engineered to act as education consultant

- `GenerateTopicBreakdown(ctx, topic)`: Breaks down complex topics into subtopics
  - Returns: Structured list of subtopics with descriptions
  - Useful for detailed topic exploration

**Data Structures**:
```go
type LearningRoadmap struct {
    ProgramName    string
    Overview       string
    TotalDuration  string
    Prerequisites  []string
    LearningSteps  []LearningStep
    KeySkills      []string
    RecommendedFor string
}

type LearningStep struct {
    StepNumber  int
    Title       string
    Description string
    Topics      []string
    Duration    string
    Difficulty  string // Beginner, Intermediate, Advanced
}
```

#### 2. YouTube Scraper Service (`pathwayLK/internal/services/scraper/youtube.go`)

**Purpose**: Search and filter high-quality educational videos

**Key Features**:
- Educational query optimization with keywords (tutorial, course, learn, etc.)
- Quality filtering:
  - Minimum view count threshold (1000+)
  - Recency filter (within 3 years)
  - Educational keyword detection in titles
- Video enrichment with duration and statistics
- Supports batch topic searches

**Key Methods**:
- `SearchVideos(ctx, topic, maxResults)`: Find videos for a specific topic
- `GetVideosByTopics(ctx, topics, videosPerTopic)`: Batch search across topics
- `filterQualityVideos(videos)`: Apply quality metrics

**API Integration**:
- Uses YouTube Data API v3
- Search with filters: embeddable, medium duration (4-20 min)
- Retrieves: title, channel, thumbnail, duration, view count, description

#### 3. Pathway Service Enhancement (`pathwayLK/internal/services/pathway/service.go`)

**New Method**: `GetLearningRoadmap(ctx, programName)`

**Workflow**:
1. Fetch program prerequisites from Neo4j
2. Generate learning roadmap using LLM client
3. For each learning step:
   - Search YouTube for videos on each topic
   - Collect top 2-4 videos per topic
   - Attach videos to learning step
4. Return complete roadmap with videos

**Response Structure**:
```go
type LearningRoadmapResponse struct {
    ProgramName    string
    Overview       string
    TotalDuration  string
    Prerequisites  []string
    KeySkills      []string
    RecommendedFor string
    Steps          []LearningStepWithVideos
}

type LearningStepWithVideos struct {
    StepNumber  int
    Title       string
    Description string
    Topics      []string
    Duration    string
    Difficulty  string
    Videos      []Video
}
```

#### 4. API Endpoint

**Route**: `GET /api/v1/pathway/programs/:name/learning-roadmap`

**Handler**: `GetLearningRoadmap()` in `pathway_handler.go`

**Request**:
- Path parameter: `name` - Program name (URL encoded)
- Example: `/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering/learning-roadmap`

**Response**:
```json
{
  "success": true,
  "data": {
    "program_name": "Bachelor of Software Engineering",
    "overview": "Comprehensive program covering...",
    "total_duration": "6-8 months",
    "prerequisites": ["Basic programming", "Mathematics"],
    "key_skills": ["Problem solving", "Algorithm design"],
    "recommended_for": "Students with A/L Pass in Mathematics",
    "steps": [
      {
        "step_number": 1,
        "title": "Programming Fundamentals",
        "description": "Learn core programming concepts...",
        "topics": ["Variables", "Control Flow", "Functions"],
        "duration": "4 weeks",
        "difficulty": "Beginner",
        "videos": [
          {
            "video_id": "abc123",
            "title": "Python Tutorial for Beginners",
            "url": "https://youtube.com/watch?v=abc123",
            "channel": "FreeCodeCamp",
            "duration": "15:30",
            "view_count": 1500000,
            "thumbnail": "https://...",
            "description": "Complete guide..."
          }
        ]
      }
    ]
  },
  "program": "Bachelor of Software Engineering",
  "request_id": "...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Frontend Components

#### 1. LearningRoadmap Component (`client/src/components/LearningRoadmap.tsx`)

**Purpose**: Display interactive learning roadmap with video resources

**Features**:
- **Google Material Design 3** styling throughout
- Expandable/collapsible learning steps
- Video card grid with thumbnails
- Difficulty badges (color-coded)
- Duration and skill indicators
- External link to YouTube videos

**UI Structure**:
```
Header
  ├── Back button
  └── Program title

Overview Card
  ├── Program description
  ├── Stats (duration, recommended for, step count)
  ├── Prerequisites chips
  └── Key skills chips

Learning Steps (Expandable Cards)
  ├── Step header (number, title, duration, difficulty)
  └── Expanded content
      ├── Description
      ├── Topics covered (chips)
      └── Video grid (2 columns)
          ├── Thumbnail
          ├── Title
          ├── Channel
          └── Duration
```

**Interaction**:
- Click step header to expand/collapse
- Click video card to open in new tab
- Hover effects on interactive elements

#### 2. App.tsx Updates

**New View State**: `'learning-roadmap'`

**Navigation Flow**:
```
Interest Selection
  ↓
Qualification Selection
  ↓
Education Roadmap (Programs)
  ↓ (click program)
Learning Roadmap (AI-generated with videos)
```

**State Management**:
- `selectedProgram`: Tracks which program to show roadmap for
- `handleProgramSelect(programName)`: Navigate to learning roadmap
- `handleBackFromLearningRoadmap()`: Return to program list

#### 3. EducationRoadmap Component Updates

**New Prop**: `onProgramSelect?: (programName: string) => void`

**Integration**: Add click handlers to program nodes to trigger learning roadmap view

## Configuration

### Environment Variables

Add to `.env` or set in environment:

```bash
# Gemini API Key (required for LLM features)
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative key names (checked in order)
GOOGLE_API_KEY=your_google_api_key_here
MLF_LLM_API_KEY=your_mlf_llm_api_key_here

# YouTube API Key (required for video search)
# Currently reuses GEMINI_API_KEY, but should be separate
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Container Initialization

Updated `internal/containers/containers.go`:
- Initialize LLM client with API key
- Initialize YouTube service
- Pass both to pathway service constructor
- Graceful degradation if LLM client fails (warns but continues)

## API Keys Setup

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key and add to environment

### 2. Get YouTube Data API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "YouTube Data API v3"
4. Navigate to Credentials
5. Create API key
6. Restrict key to YouTube Data API v3 (recommended)
7. Copy key and add to environment

## Testing

### Backend Testing

```bash
# Test learning roadmap endpoint
curl -X GET "http://localhost:8080/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering/learning-roadmap"

# Expected response should include:
# - Program overview
# - Learning steps (3-5 steps)
# - Topics for each step
# - YouTube videos for each topic
```

### Frontend Testing

1. Navigate through app flow:
   ```
   Select Interest (e.g., Engineering)
   → Select Qualification (e.g., A/L Pass)
   → View Programs
   → Click on a program
   → See Learning Roadmap
   ```

2. Verify features:
   - [ ] Loading state displays
   - [ ] Program overview renders correctly
   - [ ] Learning steps are expandable
   - [ ] Videos display with thumbnails
   - [ ] Video links open in new tab
   - [ ] Back navigation works
   - [ ] Error handling displays properly

## Error Handling

### Backend

1. **LLM Client Initialization Fails**:
   - Logs warning
   - Continues with nil client
   - Returns error when roadmap endpoint is called

2. **YouTube API Fails**:
   - Logs warning for each failed topic
   - Continues without videos for that topic
   - Returns roadmap with empty video arrays

3. **Neo4j Prerequisites Fetch Fails**:
   - Logs error
   - Continues with empty prerequisites array
   - LLM generates roadmap without prerequisite context

### Frontend

1. **API Call Fails**:
   - Shows error message
   - Displays "Try Again" button
   - Back navigation available

2. **Empty Response**:
   - Handled as error case
   - User can retry or go back

3. **Loading State**:
   - Animated spinner with message
   - "Generating your personalized learning roadmap..."

## Future Enhancements

### Short Term

1. **Click to View Roadmap**:
   - Add button to each program node in EducationRoadmap
   - "View Learning Path" action

2. **Video Player Embed**:
   - Embed YouTube player in modal
   - Watch videos without leaving app

3. **Progress Tracking**:
   - Mark completed topics
   - Track learning progress
   - Save state in local storage

### Medium Term

1. **Personalization**:
   - Adjust roadmap based on prior knowledge
   - Different paths for different learning speeds
   - Additional resources (articles, books, exercises)

2. **Video Quality Scoring**:
   - More sophisticated filtering
   - User ratings integration
   - Channel reputation scoring

3. **Interactive Learning**:
   - Quizzes after each step
   - Code challenges
   - Practical exercises

### Long Term

1. **Community Features**:
   - User comments on videos
   - Alternative resource suggestions
   - Study groups formation

2. **Adaptive Learning**:
   - Adjust difficulty based on performance
   - Skip topics if demonstrated mastery
   - Deep dives on challenging topics

3. **Integration with LMS**:
   - Export to learning management systems
   - Certificate generation
   - Instructor dashboard

## Troubleshooting

### Issue: "LLM client initialization failed"

**Cause**: Missing or invalid Gemini API key

**Solution**:
1. Check environment variable is set: `echo $GEMINI_API_KEY`
2. Verify key is valid in Google AI Studio
3. Check key hasn't expired or reached quota
4. Restart server after setting environment variable

### Issue: "No videos found for topics"

**Cause**: YouTube API key issues or quota exceeded

**Solution**:
1. Verify YouTube API key is valid
2. Check API quota in Google Cloud Console
3. Ensure YouTube Data API v3 is enabled
4. Check network connectivity to YouTube API

### Issue: "Failed to fetch learning roadmap"

**Possible Causes**:
1. Backend not running (check `http://localhost:8080/health`)
2. CORS issues (check browser console)
3. Program name not found in database
4. LLM rate limiting

**Solution**:
1. Verify backend is running: `curl http://localhost:8080/health`
2. Check backend logs for detailed errors
3. Try with different program name
4. Wait and retry if rate limited

### Issue: Empty learning roadmap returned

**Cause**: LLM returned invalid JSON or empty response

**Solution**:
1. Check backend logs for LLM response
2. Verify Gemini API is not rate limiting
3. Try with simpler program name
4. Check prompt engineering in `llm/client.go`

## Performance Considerations

### Backend

- **LLM Response Time**: 2-5 seconds per roadmap
- **YouTube Search**: 500ms - 2s per topic (cached recommended)
- **Total Roadmap Generation**: 5-15 seconds depending on complexity

**Optimization Ideas**:
- Cache roadmaps in Redis (24-hour TTL)
- Batch YouTube searches
- Pre-generate roadmaps for popular programs
- Implement streaming response for progressive loading

### Frontend

- **Initial Load**: Instant (displays loading state)
- **Roadmap Render**: <100ms once data received
- **Video Thumbnails**: Lazy loaded

**Optimization Ideas**:
- Prefetch roadmaps when program is hovered
- Optimize image loading with responsive sizes
- Virtual scrolling for long roadmaps

## Security Considerations

1. **API Keys**: 
   - Never commit to version control
   - Use environment variables only
   - Rotate keys periodically

2. **Rate Limiting**:
   - Implement per-user limits on backend
   - Cache responses aggressively
   - Monitor API usage

3. **Input Validation**:
   - Sanitize program names
   - Validate all user inputs
   - Prevent injection attacks

4. **CORS**:
   - Restrict to known origins in production
   - Use proper CORS headers

## Monitoring and Analytics

### Backend Metrics

- LLM API calls (success/failure rate)
- YouTube API calls (quota usage)
- Roadmap generation time (avg, p95, p99)
- Error rates by type

### Frontend Metrics

- Page views per step
- Video click-through rate
- Average time on roadmap page
- Drop-off points in learning flow

### Logging

Key events to log:
- Roadmap generation start/complete
- LLM prompt and response
- YouTube search queries
- API errors with context
- User navigation flow

## Conclusion

The Learning Roadmap feature provides students with personalized, AI-generated learning paths enhanced with curated video resources. By combining Gemini's educational expertise with YouTube's vast educational content library, we create a comprehensive preparation guide for each program.

The implementation follows Google Material Design 3 principles for a consistent, modern UI experience, and uses robust error handling to ensure graceful degradation when external services are unavailable.
