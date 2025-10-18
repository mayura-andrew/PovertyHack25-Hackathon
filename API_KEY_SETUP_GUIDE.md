# 🔑 API Key Setup Guide

## Quick Setup (3 Steps)

### Step 1: Get Your Google API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click **"Create API Key"** button
   - Select your Google Cloud project (or create a new one)
   - Copy the generated API key

3. **Enable Required APIs** (in Google Cloud Console)
   - Go to: https://console.cloud.google.com/
   - Enable **"Generative Language API"** (for Gemini)
   - Enable **"YouTube Data API v3"** (for video search)

### Step 2: Set Environment Variable

#### Option A: Using .env file (Recommended for local development)

1. Create `.env` file in `pathwayLK` directory:
   ```bash
   cd pathwayLK
   cp .env.example .env
   ```

2. Edit `.env` file and add your key:
   ```bash
   GOOGLE_API_KEY=AIzaSyD-your-actual-api-key-here
   GEMINI_API_KEY=AIzaSyD-your-actual-api-key-here
   YOUTUBE_API_KEY=AIzaSyD-your-actual-api-key-here
   ```

#### Option B: Using Docker Compose (Recommended for Docker)

1. Create `.env` file in `pathwayLK` directory:
   ```bash
   echo "GOOGLE_API_KEY=AIzaSyD-your-actual-api-key-here" > .env
   ```

2. Docker Compose will automatically read from `.env` file

#### Option C: Export in shell (Temporary)

```bash
export GOOGLE_API_KEY=AIzaSyD-your-actual-api-key-here
```

**Note**: This only works for the current terminal session

### Step 3: Verify Setup

#### Test with Docker Compose:
```bash
cd pathwayLK

# Start services
docker-compose up -d

# Check logs for successful initialization
docker-compose logs app | grep -i "llm\|youtube"

# Expected output:
# ✅ "LLM client initialized successfully"
# ✅ "YouTube service initialized successfully"
```

#### Test with Direct Go Run:
```bash
cd pathwayLK

# Make sure .env is loaded
source .env

# Run the server
go run cmd/server/main.go

# Look for:
# ✅ "Initializing LLM client"
# ✅ "LLM client initialized successfully"
# ✅ "Initializing YouTube service"
# ✅ "YouTube service initialized successfully"
```

#### Test the API:
```bash
# Test learning roadmap endpoint
curl "http://localhost:8080/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours/learning-roadmap"

# Should return JSON with:
# - program_name
# - overview
# - steps[]
# - steps[].videos[]
```

## 🔒 Security Best Practices

### 1. Keep Your API Key Secret ⚠️

**DO NOT:**
- ❌ Commit `.env` to Git
- ❌ Share your key in screenshots
- ❌ Post your key in public forums
- ❌ Hardcode key in source code

**DO:**
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Restrict key in Google Cloud Console

### 2. Add .env to .gitignore

Make sure your `.gitignore` includes:
```gitignore
.env
.env.local
.env.*.local
*.key
```

### 3. Restrict API Key (Recommended)

In Google Cloud Console:
1. Go to **Credentials**
2. Click on your API key
3. **Restrict key**:
   - API restrictions: Select "Restrict key"
   - Select only:
     - ✅ Generative Language API
     - ✅ YouTube Data API v3
4. (Optional) Set **Application restrictions**:
   - IP addresses (if running on server)
   - Referrer URLs (if using from web)

## 📊 API Quotas and Limits

### Gemini API
- **Free Tier**: 60 requests per minute
- **Paid Tier**: Higher limits available
- **Cost**: Free for development, pay-as-you-go for production

### YouTube Data API
- **Free Tier**: 10,000 units per day
- **Search request**: 100 units
- **Video details**: 1 unit
- **Average usage**: ~400 units per learning roadmap (4 searches + enrichment)
- **Daily capacity**: ~25 learning roadmaps per day (free tier)

### Monitoring Usage
1. Visit: https://console.cloud.google.com/apis/dashboard
2. Select your project
3. View API usage graphs
4. Set up quota alerts

## 🐛 Troubleshooting

### Issue: "LLM client initialization failed"

**Check:**
```bash
# 1. Verify environment variable is set
echo $GOOGLE_API_KEY

# 2. Check if key is valid (should start with AIza)
echo $GOOGLE_API_KEY | grep "^AIza"

# 3. Test key directly
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GOOGLE_API_KEY"
```

**Solutions:**
- Get a new API key from Google AI Studio
- Make sure Generative Language API is enabled
- Check for typos in the key
- Restart the server after setting the variable

### Issue: "No videos found" or "YouTube API error"

**Check:**
```bash
# Test YouTube API directly
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=python+tutorial&type=video&key=$GOOGLE_API_KEY"
```

**Solutions:**
- Verify YouTube Data API v3 is enabled in Google Cloud Console
- Check API quota hasn't been exceeded
- Wait a few minutes if rate limited
- Use a different API key if one is compromised

### Issue: "Invalid API key" or "API key not valid"

**Causes:**
- Key hasn't been enabled yet (wait 1-2 minutes)
- Key is restricted to wrong APIs
- Key has expired or been deleted
- Wrong project selected

**Solution:**
- Create a new API key
- Remove all restrictions initially to test
- Add restrictions back after confirming it works

### Issue: Docker Compose not picking up .env

**Check:**
```bash
# 1. Verify .env file exists
ls -la pathwayLK/.env

# 2. Check docker-compose reads it
docker-compose config | grep GOOGLE_API_KEY

# 3. Check inside container
docker-compose exec app env | grep GOOGLE_API_KEY
```

**Solutions:**
- Make sure `.env` is in the same directory as `docker-compose.yml`
- Restart docker-compose: `docker-compose down && docker-compose up -d`
- Pass explicitly: `docker-compose up -d --env-file .env`

## 📝 Example .env File

```bash
# ===========================================
# REQUIRED: Google API Key
# ===========================================
# Get from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=AIzaSyDExample-Your-Actual-Key-Here-1234567890

# These use the same key
GEMINI_API_KEY=AIzaSyDExample-Your-Actual-Key-Here-1234567890
YOUTUBE_API_KEY=AIzaSyDExample-Your-Actual-Key-Here-1234567890

# ===========================================
# Application Configuration
# ===========================================
ENVIRONMENT=development
PORT=8080
LOG_LEVEL=info
LOG_FORMAT=json

# ===========================================
# Database Configuration
# ===========================================
# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=neo4j

# MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017
MONGODB_DATABASE=pathwaylk
MONGODB_USERNAME=admin
MONGODB_PASSWORD=password123

# ===========================================
# LLM Provider
# ===========================================
LLM_PROVIDER=gemini
LLM_API_KEY=AIzaSyDExample-Your-Actual-Key-Here-1234567890
```

## ✅ Verification Checklist

Before running your application, verify:

- [ ] Google API key obtained from AI Studio
- [ ] Generative Language API enabled in Google Cloud Console
- [ ] YouTube Data API v3 enabled in Google Cloud Console
- [ ] `.env` file created in `pathwayLK/` directory
- [ ] `GOOGLE_API_KEY` set in `.env` file
- [ ] `.env` added to `.gitignore`
- [ ] Docker Compose restarted (if using Docker)
- [ ] Backend logs show "LLM client initialized successfully"
- [ ] Backend logs show "YouTube service initialized successfully"
- [ ] Test API endpoint returns learning roadmap with videos

## 🚀 Quick Start Commands

```bash
# 1. Navigate to backend directory
cd pathwayLK

# 2. Create .env file
cp .env.example .env

# 3. Edit .env and add your API key
nano .env  # or use your preferred editor

# 4. Start with Docker Compose
docker-compose up -d

# 5. Check logs
docker-compose logs -f app

# 6. Test the feature
curl "http://localhost:8080/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours/learning-roadmap"

# 7. Open frontend
cd ../client
pnpm dev
```

## 📚 Additional Resources

- **Google AI Studio**: https://makersuite.google.com/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Gemini API Docs**: https://ai.google.dev/docs
- **YouTube Data API Docs**: https://developers.google.com/youtube/v3
- **API Key Best Practices**: https://cloud.google.com/docs/authentication/api-keys

## 💰 Cost Estimate

### Free Tier (Suitable for Development & Testing)
- **Gemini API**: Free up to 60 requests/min
- **YouTube API**: Free up to 10,000 units/day (~25 roadmaps)
- **Total Cost**: $0/month

### Production Usage (Estimated)
- **Gemini API**: $0.00025 per request
- **YouTube API**: Free within quota, $0 over quota
- **100 users/day**: ~$7.50/month
- **1000 users/day**: ~$75/month

**Note**: Actual costs may vary. Monitor usage in Google Cloud Console.

---

**Need Help?** Check the troubleshooting section or review the main documentation in `/LEARNING_ROADMAP_FEATURE.md`
