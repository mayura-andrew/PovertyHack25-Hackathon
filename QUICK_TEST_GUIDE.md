# Quick Test Guide - Engineering Pathway Fix

## 🎯 Problem
- **Engineering & Technology** pathway wasn't displaying/was disappearing
- **Healthcare** was working fine
- Need **ONLY Engineering** to work for demo

## ✅ Solution Applied

### Root Causes Fixed:
1. ✅ Filter was excluding prerequisite programs (Advanced Certificate, NVQ)
2. ✅ Animation wasn't properly maintaining state
3. ✅ Missing debug logging to diagnose issues

## 🚀 Quick Start

### 1. Terminal 1 - Backend
```bash
cd pathwayLK
make run
# Should see: Server starting on :8080
```

### 2. Terminal 2 - Frontend  
```bash
cd client
pnpm dev
# Should see: Local: http://localhost:5173
```

### 3. Test in Browser
1. Open `http://localhost:5173`
2. Click **"Engineering & Technology"** card
3. Open Browser Console (F12)

## ✅ Expected Results

### Console Output:
```
Fetching programs for: engineering-and-technology
Institute: The Open University of Sri Lanka
Total programs fetched: 11
Filtered programs: 11
Programs: ["Advanced Certificate in Science", "NVQ Level 3", "NVQ Level 4", ...]
Generated 25 nodes and 30 edges
```

### Visual Display:
```
Layer 1 (Top) - Yellow badges:
🎯 Start Here
├─ G.C.E. (O/L) Examination Pass
├─ Age Requirement
└─ G.C.E. (O/L) Not Passed

Layer 2 - Green badges:
Foundation Program
├─ NVQ Level 3 (ICT Technician)
├─ NVQ Level 4 (Hardware Technician)
└─ Advanced Certificate in Science

Layer 3 - Blue badges:
Bachelor's Degree
├─ BSc Honours - Computer Engineering
├─ BSc Honours - Electrical Engineering
├─ BSc Honours - Electronics & Communication
├─ Civil Engineering Programme
├─ Mechanical Engineering Programme
├─ Mechatronics Engineering
├─ Agricultural Engineering
├─ Industrial Studies in Agriculture
└─ Textile & Apparel Technology

Layer 4 (Bottom) - Pink badges:
💼 Your Future
├─ Software Engineer
├─ Hardware Engineer
├─ Network Administrator
├─ Civil Engineer
└─ Structural Engineer
```

### Animation:
- Nodes appear one by one (800ms intervals)
- Edges connect as nodes appear
- Map auto-zooms to fit viewport
- Counter shows: "Growing roadmap... X/25"
- **Stays visible after completion** ✅

## ❌ If It Doesn't Work

### Check #1: Backend Running?
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Check #2: Data in Neo4j?
```bash
curl http://localhost:8080/api/v1/pathway/institutes
# Should return list with "The Open University of Sri Lanka"
```

### Check #3: Programs Endpoint?
```bash
curl "http://localhost:8080/api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs"
# Should return programs array
```

### Check #4: Browser Console Errors?
- Look for network errors (CORS, 404, 500)
- Look for JavaScript errors
- Check debug logs we added

## 🐛 Common Issues

### Issue: "No programs found"
**Fix**: Check Neo4j is running and populated with data
```bash
docker ps | grep neo4j
# Should show running container
```

### Issue: CORS Error
**Fix**: Backend should have CORS middleware enabled (already configured)

### Issue: Roadmap disappears after animation
**Fix**: Already fixed! Animation now properly maintains state

### Issue: Filter too restrictive
**Fix**: Already fixed! Now includes certificates and NVQ programs

## 📊 Data Flow

```
User clicks "Engineering & Technology"
    ↓
EducationRoadmap component mounts
    ↓
useEffect triggers fetchPathwayData()
    ↓
API call to backend: GET /api/v1/pathway/institutes/.../programs
    ↓
Backend queries Neo4j
    ↓
Returns programs with prerequisites and career paths
    ↓
Frontend filters by engineering criteria
    ↓
transformProgramsToFlow() creates nodes/edges in 4 layers
    ↓
startAnimation() displays nodes one by one
    ↓
✅ Complete pathway visible
```

## 🎨 Visual Indicators

| Level | Color | Icon | Description |
|-------|-------|------|-------------|
| Qualification | 🟡 Amber | 📋 | Entry requirements |
| Foundation | 🟢 Green | 🎓 | NVQ, Certificates |
| Degree | 🔵 Blue | 📘 | Bachelor's programs |
| Career | 🟣 Pink | 💼 | Job outcomes |

## ✨ New Features

1. **Better Filtering** - Includes all pathway components
2. **4-Layer Visualization** - Clear progression path
3. **Debug Logging** - Easy to diagnose issues
4. **Improved Animation** - Smoother, more reliable
5. **Beautiful UI** - Gradient header, better styling
6. **"Show All" Button** - Skip animation, see everything
7. **Auto-fit Viewport** - Always perfectly zoomed

## 📝 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access home page
- [ ] Engineering card is clickable
- [ ] Loading indicator appears
- [ ] Console shows debug logs
- [ ] Nodes animate in sequence
- [ ] Edges connect properly
- [ ] Animation completes
- [ ] **Roadmap stays visible** ✅
- [ ] "Show All" button works
- [ ] "Animate" button works
- [ ] Can navigate back
- [ ] Can view other interests

## 🎯 Success Criteria

✅ Engineering pathway displays complete flow from O/L to Career
✅ All nodes and edges visible
✅ Roadmap doesn't disappear
✅ Smooth animation
✅ Can interact with nodes (hover effects)
✅ Console shows no errors

---

**Status**: Ready for demo ✅
**Primary Interest**: Engineering & Technology only
**Last Updated**: October 18, 2025
