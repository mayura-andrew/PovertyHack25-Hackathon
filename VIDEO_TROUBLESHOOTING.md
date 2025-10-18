# Video Display Issue Troubleshooting Guide

## Problem
Video audio plays but video doesn't display (black screen)

## Common Causes & Solutions

### 1. **Codec Compatibility**
The video might use a codec not supported by the browser.

**Solution:** Re-encode the video
```bash
# Using ffmpeg (install if needed)
ffmpeg -i engineering.mp4 -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart engineering_web.mp4
```

This creates a web-optimized video with:
- H.264 baseline profile (maximum compatibility)
- AAC audio
- Fast start (progressive download)

### 2. **Video Dimensions Issue**
Video might have unusual dimensions or rotation metadata.

**Check video info:**
```bash
ffmpeg -i engineering.mp4
```

Look for:
- Resolution (should be standard like 1920x1080, 1280x720)
- Rotation metadata
- Pixel format

**Fix rotation/dimensions:**
```bash
# Remove rotation metadata
ffmpeg -i engineering.mp4 -c copy -metadata:s:v:0 rotate=0 engineering_fixed.mp4

# Or resize to standard HD
ffmpeg -i engineering.mp4 -vf "scale=1280:720" -c:v libx264 engineering_720p.mp4
```

### 3. **Browser Console Checks**

Open browser console (F12) and check for:
```javascript
// Video element properties
const video = document.getElementById('hero-video')
console.log({
  videoWidth: video.videoWidth,
  videoHeight: video.videoHeight,
  readyState: video.readyState,
  error: video.error,
  networkState: video.networkState
})
```

**ReadyState values:**
- 0 = HAVE_NOTHING
- 1 = HAVE_METADATA
- 2 = HAVE_CURRENT_DATA
- 3 = HAVE_FUTURE_DATA
- 4 = HAVE_ENOUGH_DATA

### 4. **CSS/Layout Issues**

Try adding inline styles:
```tsx
<video
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'contain',  // or 'cover'
    backgroundColor: '#000'
  }}
/>
```

### 5. **Use Native Controls (Temporary Test)**

Replace custom controls with native to test if video plays:
```tsx
<video
  controls  // Native browser controls
  src={engineeringVideo}
  style={{ width: '100%', height: 'auto' }}
/>
```

## Quick Test Implementation

Add this to your component for debugging:
```tsx
{showVideo && (
  <div className="p-4 bg-yellow-100 text-xs">
    <p>Video Debug Info:</p>
    <button onClick={() => {
      const v = document.getElementById('hero-video')
      console.log('Video element:', v)
      console.log('Width:', v?.videoWidth)
      console.log('Height:', v?.videoHeight)
      console.log('ReadyState:', v?.readyState)
      console.log('CurrentTime:', v?.currentTime)
    }}>
      Log Video Info
    </button>
  </div>
)}
```

## Recommended Video Specifications

For maximum compatibility:

**Container:** MP4
**Video Codec:** H.264 (AVC)
**Video Profile:** Baseline or Main
**Audio Codec:** AAC
**Resolution:** 1280x720 or 1920x1080
**Frame Rate:** 30fps or 60fps
**Bitrate:** 2-5 Mbps for 720p, 5-10 Mbps for 1080p

## Browser Compatibility Test

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Different browsers have different codec support.

## Alternative: Use YouTube/Vimeo Embed

If issues persist, host video on YouTube/Vimeo:

```tsx
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  className="w-full aspect-video"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

## File Size Optimization

Keep video under 10MB for fast loading:
```bash
# Compress video
ffmpeg -i input.mp4 -b:v 1M -b:a 128k output.mp4
```

## Next Steps

1. Run `ffmpeg -i engineering.mp4` to check video info
2. Re-encode if needed using the commands above
3. Test with native controls first
4. Check browser console for errors
5. Verify file path is correct
