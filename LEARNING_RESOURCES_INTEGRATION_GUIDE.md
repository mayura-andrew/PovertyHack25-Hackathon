# Learning Resources Integration Guide

## 🎉 Feature Overview

The **Free Learning Resources** feature is now fully integrated into the application! When teachers view education pathways, they can click on any program node to see AI-generated learning roadmaps with curated YouTube video resources.

## 📋 How It Works - User Flow

### Step 1: Select Interest Area
- Teacher selects an area of interest (e.g., "Engineering & Technology")

### Step 2: Select Qualification Level
- Teacher selects the student's current qualification:
  - ✅ O/L Pass
  - ❌ O/L Failed  
  - ✅ A/L Pass
  - 🔄 A/L Attempted

### Step 3: View Education Pathway
- System displays personalized pathway showing:
  - Entry qualifications (amber nodes)
  - Foundation programs (green nodes) - **CLICKABLE**
  - Degree programs (blue nodes) - **CLICKABLE**
  - Career outcomes (purple nodes)

### Step 4: Click a Program Node 🆕
- **Look for**: "View Free Learning Resources" text at the bottom of program cards
- **Programs are clickable** - they have:
  - Cursor changes to pointer on hover
  - Slight scale effect on hover
  - Blue text link at the bottom
  
### Step 5: View Learning Roadmap 🎓
System generates and displays:
- **Program Overview**: Description, duration, recommended audience
- **Prerequisites**: Required knowledge before starting
- **Key Skills**: What you'll learn
- **Learning Steps**: Structured path with:
  - Step number and title
  - Detailed description
  - Topics covered
  - Duration estimate
  - Difficulty level (Beginner/Intermediate/Advanced)
  - **2-4 YouTube Videos** per step with:
    - Thumbnail preview
    - Video title
    - Channel name
    - Duration
    - Direct link to watch

## 🔧 Technical Implementation

### Files Modified

#### 1. **CourseNode.tsx** - Program Cards
```tsx
// Added click handling
const isClickable = (data.level === 'beginner' || data.level === 'intermediate' || data.level === 'advanced') && data.onProgramClick

const handleClick = () => {
  if (isClickable && data.onProgramClick) {
    data.onProgramClick(data.title)
  }
}

// Visual indicator
{isClickable && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
      <BookOpen className="w-4 h-4" />
      <span>View Free Learning Resources</span>
    </div>
  </div>
)}
```

**Changes**:
- ✅ Added click event handler
- ✅ Added hover effects for clickable nodes
- ✅ Added visual indicator for learning resources
- ✅ Only program nodes (beginner/intermediate/advanced) are clickable
- ✅ Requirement and career nodes remain non-clickable

#### 2. **pathwayTransform.ts** - Data Transformation
```tsx
export function transformProgramsToFlow(
  programs: Program[], 
  onProgramClick?: (programName: string) => void // New parameter
): { nodes: Node[], edges: Edge[] }
```

**Changes**:
- ✅ Added optional `onProgramClick` callback parameter
- ✅ Passes callback to prerequisite program nodes
- ✅ Passes callback to degree program nodes
- ✅ Does NOT pass to qualification or career nodes

#### 3. **EducationRoadmap.tsx** - Roadmap View
```tsx
// Pass onProgramSelect to transform function
const { nodes: flowNodes, edges: flowEdges } = transformProgramsToFlow(programs, onProgramSelect)
```

**Changes**:
- ✅ Receives `onProgramSelect` prop from App.tsx
- ✅ Passes it to `transformProgramsToFlow()`
- ✅ Enables program nodes to trigger learning roadmap

#### 4. **App.tsx** - State Management
```tsx
const [currentView, setCurrentView] = useState<AppView>('learning-roadmap') // Added new view
const [selectedProgram, setSelectedProgram] = useState<string | null>(null)

const handleProgramSelect = (programName: string) => {
  setSelectedProgram(programName)
  setCurrentView('learning-roadmap')
}

// New view rendering
{currentView === 'learning-roadmap' && selectedProgram && (
  <LearningRoadmap 
    programName={selectedProgram}
    onBack={handleBackFromLearningRoadmap}
  />
)}
```

**Changes**:
- ✅ Added 'learning-roadmap' view state
- ✅ Added selectedProgram state
- ✅ Added handleProgramSelect handler
- ✅ Added LearningRoadmap component rendering
- ✅ Connected back navigation

## 🎨 UI/UX Features

### Program Node Enhancements
- **Hover Effect**: Scales to 105% and shows shadow
- **Cursor**: Changes to pointer when hovering clickable nodes
- **Visual Indicator**: Blue "View Free Learning Resources" text with book icon
- **Smooth Transitions**: 200ms transition for all hover effects

### Learning Roadmap Page
- **Google Material Design 3**: Consistent styling throughout
- **Expandable Steps**: Click step header to expand/collapse content
- **Color-Coded Difficulty**:
  - 🟢 Beginner: Green badge
  - 🔵 Intermediate: Blue badge  
  - 🟠 Advanced: Orange badge
- **Video Cards**: Grid layout with thumbnails
- **External Links**: Opens YouTube in new tab
- **Responsive Design**: Works on all screen sizes

## 🔍 What Makes a Node Clickable?

### Clickable Nodes ✅
- **Foundation Programs** (level: 'beginner')
  - Example: "Advanced Certificate in Science"
  - Example: "ICT Technician (NVQ Level 3)"
  
- **Degree Programs** (level: 'intermediate' or 'advanced')
  - Example: "Bachelor of Software Engineering Honours"
  - Example: "BSc Honours in Engineering - Computer Engineering"

### Non-Clickable Nodes ❌
- **Entry Qualifications** (level: 'requirement')
  - Example: "G.C.E. (O/L) Examination Pass"
  
- **Career Outcomes** (level: 'career')
  - Example: "Software Engineer"

## 📊 Backend Integration

### API Endpoint
```
GET /api/v1/pathway/programs/:name/learning-roadmap
```

### Example Request
```bash
curl "http://localhost:8080/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours/learning-roadmap"
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "program_name": "Bachelor of Software Engineering Honours",
    "overview": "Comprehensive program covering...",
    "total_duration": "6-8 months preparation",
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
  }
}
```

## 🚀 Testing the Feature

### 1. Start Backend
```bash
cd pathwayLK
make run
```

### 2. Start Frontend
```bash
cd client
pnpm dev
```

### 3. Test Flow
1. Open browser: `http://localhost:5173`
2. Select "Engineering & Technology"
3. Select "A/L Pass"
4. Wait for pathway to load
5. **Look for programs with "View Free Learning Resources"**
6. Click on a program (e.g., "Bachelor of Software Engineering Honours")
7. See AI-generated learning roadmap with YouTube videos

### Expected Behavior
- ✅ Program nodes should have hover effects
- ✅ Clicking should log: "Program clicked: [Program Name]"
- ✅ View should transition to learning roadmap
- ✅ Loading spinner should show while generating
- ✅ Roadmap should display with steps and videos
- ✅ Back button should return to pathway view

## 🐛 Troubleshooting

### Issue: "View Free Learning Resources" not showing

**Solution**: Check that:
- Node has `level` set to 'beginner', 'intermediate', or 'advanced'
- `onProgramClick` is passed in node data
- CourseNode component received the updated code

### Issue: Clicking does nothing

**Solution**: Check browser console for:
- "Program clicked: [name]" message
- Any JavaScript errors
- Verify `onProgramSelect` is defined in App.tsx

### Issue: Learning roadmap not loading

**Solution**: 
1. Check backend is running: `curl http://localhost:8080/health`
2. Check API keys are set:
   ```bash
   echo $GEMINI_API_KEY
   ```
3. Check backend logs for errors
4. Verify program name is URL-encoded properly

### Issue: No videos showing

**Solution**:
- Verify YouTube API key is configured
- Check API quota in Google Cloud Console
- Check backend logs for YouTube API errors
- Videos may be empty if no matches found

## 📈 Future Enhancements

### Phase 1 (Current) ✅
- [x] Clickable program nodes
- [x] AI-generated learning roadmaps
- [x] YouTube video integration
- [x] Google Material Design UI

### Phase 2 (Planned) 📋
- [ ] Video player modal (watch without leaving app)
- [ ] Progress tracking (mark completed topics)
- [ ] Save roadmap to profile
- [ ] Share roadmap with students
- [ ] Print/export roadmap as PDF

### Phase 3 (Future) 🔮
- [ ] Interactive quizzes after each step
- [ ] Community discussions per topic
- [ ] Alternative resource recommendations
- [ ] Personalized difficulty adjustment
- [ ] Study group formation

## 💡 Tips for Teachers

1. **Best Practice**: Show students the learning roadmap BEFORE they apply to programs
2. **Preparation Time**: Roadmaps show realistic time estimates for preparation
3. **Video Quality**: All videos are filtered for quality (1000+ views, recent, educational)
4. **Step-by-Step**: Encourage students to complete steps in order
5. **Feedback**: Videos are selected by AI but teachers can provide better alternatives

## 🎯 Success Metrics

Track these metrics to measure feature success:
- % of teachers who click "View Learning Resources"
- Average time spent on learning roadmap page
- Number of video clicks per session
- Student feedback on video quality
- Improvement in program application readiness

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs: `docker logs pathwayLK`
3. Review API documentation: `/LEARNING_ROADMAP_FEATURE.md`
4. Test API endpoints directly with curl
5. Verify all environment variables are set

---

**Built with ❤️ using:**
- React + TypeScript
- Gemini AI (Google)
- YouTube Data API
- Neo4j Graph Database
- Google Material Design 3
