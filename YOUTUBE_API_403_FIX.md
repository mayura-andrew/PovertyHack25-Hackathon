# YouTube API 403 Error - Fix Guide

## 🔴 Problem

```
"error":"YouTube API returned status 403"
```

**Cause**: The API key you're using (GOOGLE_API_KEY) doesn't have YouTube Data API v3 enabled or has wrong permissions.

## ✅ Solution Options

### Option 1: Enable YouTube Data API (Recommended)

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Select your project** (same one used for Gemini API)

3. **Enable YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "ENABLE"

4. **Create a new API key** (or use existing):
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - **Restrict the key**:
     - API restrictions: Select "YouTube Data API v3"
     - (Optional) Application restrictions: Your server IP

5. **Update your .env file**:
   ```bash
   # Use separate key for YouTube
   YOUTUBE_API_KEY=AIzaSyD-your-youtube-api-key-here
   ```

6. **Rebuild and restart**:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

### Option 2: Use the Same Key (If quota allows)

If you want to use ONE key for both Gemini and YouTube:

1. **Enable YouTube Data API v3** on your existing key's project
2. **Edit the API restrictions** on your key:
   - Go to "Credentials" → Click your API key
   - Under "API restrictions", add:
     - ✅ Generative Language API
     - ✅ YouTube Data API v3

3. **Keep using GOOGLE_API_KEY** for both:
   ```bash
   # .env file
   GOOGLE_API_KEY=AIzaSyD-your-key-here
   GEMINI_API_KEY=${GOOGLE_API_KEY}
   YOUTUBE_API_KEY=${GOOGLE_API_KEY}
   ```

### Option 3: Disable YouTube Integration (Temporary)

If you don't want to set up YouTube API right now:

**Update:** `pathwayLK/internal/services/pathway/service.go`

```go
// Skip YouTube search if no API key configured
if s.youtubeService == nil {
    s.logger.Warn("YouTube service not configured, skipping video search")
    stepWithVideos := LearningStepWithVideos{
        StepNumber:  step.StepNumber,
        Title:       step.Title,
        Description: step.Description,
        Topics:      step.Topics,
        Duration:    step.Duration,
        Difficulty:  step.Difficulty,
        Videos:      []scraper.Video{}, // Empty array
    }
    response.Steps = append(response.Steps, stepWithVideos)
    continue
}
```

## 🧪 Test YouTube API Key

```bash
# Test if YouTube API is accessible
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=python+tutorial&type=video&maxResults=1&key=YOUR_API_KEY"

# Expected: JSON response with video results
# If 403: API not enabled or key restricted
```

## 📊 API Quota Info

### Free Tier Limits:
- **10,000 units/day** free
- Search request = **100 units**
- Video details = **1 unit** per video

### Your Current Usage:
- Each learning roadmap ≈ **400-800 units**
  - 8 steps × 3 topics × 100 units (search) = 2,400 units
  - Plus enrichment (1 unit × videos)
- **~12-25 roadmaps per day** within free quota

### Monitor Usage:
- https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

## 🔧 Quick Fix Commands

```bash
# 1. Stop containers
cd pathwayLK
docker-compose down

# 2. Update .env with YouTube key
echo "YOUTUBE_API_KEY=AIzaSyD-your-youtube-key-here" >> .env

# 3. Rebuild (if needed)
docker-compose build

# 4. Start
docker-compose up -d

# 5. Check logs
docker-compose logs -f app | grep -i youtube
```

## ✅ Verification

After fixing, you should see:

```bash
# Successful log
{"msg":"searching YouTube videos","topic":"Programming Fundamentals","max_results":2}
{"msg":"YouTube search completed","total_found":10,"quality_videos":5}
```

Instead of:

```bash
# Error log
{"msg":"YouTube API search failed","error":"YouTube API returned status 403"}
```

## 📝 Frontend Changes

The frontend has been updated to handle missing videos gracefully:

**Before:**
```tsx
{step.videos.length > 0 && (  // ❌ Crashes if videos is null
```

**After:**
```tsx
{step.videos && step.videos.length > 0 && (  // ✅ Safe null check
```

**Also added:**
- ⚠️ Warning message when videos unavailable
- 📚 Suggestion to manually search YouTube
- No crashes, just graceful degradation

## 🎯 Recommended Setup

**Development:**
```bash
# .env
GOOGLE_API_KEY=AIzaSyD-your-gemini-key
YOUTUBE_API_KEY=AIzaSyD-your-youtube-key  # Can be same key if both APIs enabled
```

**Production:**
```bash
# Use separate keys for better quota management
GEMINI_API_KEY=AIzaSyD-gemini-production-key
YOUTUBE_API_KEY=AIzaSyD-youtube-production-key
```

## 🚨 Common Mistakes

1. **❌ Using Gemini key without enabling YouTube API**
   - Fix: Enable YouTube Data API v3 in Google Cloud Console

2. **❌ API key restricted to wrong APIs**
   - Fix: Edit key restrictions to include YouTube Data API v3

3. **❌ Billing not enabled** (for production)
   - Free tier works, but need billing account linked

4. **❌ Key quota exceeded**
   - Fix: Wait for quota reset (midnight Pacific Time) or upgrade

5. **❌ Wrong project selected in Cloud Console**
   - Fix: Switch to correct project where Gemini API is enabled

## 📞 Still Having Issues?

### Debug Steps:

1. **Check if API is enabled**:
   ```bash
   # List enabled APIs
   gcloud services list --enabled --project=YOUR_PROJECT_ID | grep youtube
   ```

2. **Test key directly**:
   ```bash
   curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_KEY"
   ```

3. **Check container environment**:
   ```bash
   docker-compose exec app env | grep YOUTUBE
   ```

4. **View detailed logs**:
   ```bash
   docker-compose logs app --tail=100 | grep -A 5 "YouTube"
   ```

## 🎓 Summary

**The learning roadmap feature works WITHOUT YouTube videos**. Videos are optional enhancement.

**Current State:**
- ✅ Gemini LLM generating roadmaps (working)
- ✅ Learning steps with topics (working)
- ❌ YouTube video suggestions (403 error)
- ✅ Frontend handles missing videos gracefully

**After Fix:**
- ✅ Everything works
- ✅ Videos appear in roadmap
- 🎉 Complete feature!

---

**Quick Start:** Enable YouTube Data API v3 in Google Cloud Console, copy the same API key, restart Docker containers. Done! 🚀
