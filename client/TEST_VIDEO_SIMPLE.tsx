// TEMPORARY TEST VERSION - Replace the video card section with this to test with native controls

{/* Video Preview Card - SIMPLE TEST VERSION */}
<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
  <video 
    controls
    className="w-full aspect-video bg-black"
    src={engineeringVideo}
    poster={engineering}
    style={{
      maxWidth: '100%',
      height: 'auto',
      display: 'block'
    }}
    onLoadedMetadata={(e) => {
      const v = e.currentTarget
      console.log('Video loaded:', {
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration,
        src: v.src
      })
    }}
    onError={(e) => {
      console.error('Video load error:', e)
      const v = e.currentTarget
      if (v.error) {
        console.error('Error code:', v.error.code)
        console.error('Error message:', v.error.message)
      }
    }}
  />
  <div className="p-4">
    <p className="text-sm font-medium text-gray-900">Test Version - Native Controls</p>
    <p className="text-xs text-gray-500">If you see video here, the file is good. Issue is with custom player.</p>
  </div>
</div>
