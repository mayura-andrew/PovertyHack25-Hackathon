import { useMemo, useState } from 'react'
import { BookOpen, Wrench, Code, Palette, Users, ArrowRight, X, Fish, Search, Grid3x3, List, Play, Pause, Briefcase } from 'lucide-react'
import engineering from "../assets/engineering.jpeg"
import engineeringVideo from "../assets/engineering.mp4"
import health from "../assets/health.jpeg"
import ict from "../assets/it.jpeg"
import hostipality from "../assets/tourism.jpeg"
import education from "../assets/education.jpeg"
import construction from "../assets/civil.jpeg"
import mgt from "../assets/mgt.jpeg"
import logo from "../assets/logo.png"
import agree from "../assets/agree.jpeg"
interface InterestSelectionProps {
  onSelect: (interest: string) => void
  onViewJobs?: () => void
}

const interests = [
  { id: 'engineering-and-technology', name: 'Engineering & Technology', icon: Wrench, color: '#1976d2', image: engineering },
  { id: 'healthcare-and-medical-science', name: 'Healthcare & Medical Science', icon: BookOpen, color: '#7b1fa2', image: health },
  { id: 'information-technology', name: 'Information Technology', icon: Code, color: '#c2185b', image: ict },
  { id: 'hospitality-and-tourism', name: 'Hospitality & Tourism', icon: Palette, color: '#f57c00', image: hostipality },
  { id: 'business-and-management', name: 'Business & Management', icon: Users, color: '#388e3c', image: mgt },
  { id: 'education-and-childcare', name: 'Education & Childcare', icon: BookOpen, color: '#fbc02d', image: education },
  { id: 'construction-and-quantity-survey', name: 'Construction & Quantity Survey', icon: Wrench, color: '#00796b', image: construction },
  { id: 'agriculture-and-aquatic-resources', name: 'Agriculture And Aquatic Resources', icon: Fish, color: '#0097a7', image: agree },
]

export default function InterestSelection({ onSelect, onViewJobs }: InterestSelectionProps) {
  const [query, setQuery] = useState('')
  const [compact, setCompact] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true) // Start as true for autoplay
  const [showVideo, setShowVideo] = useState(true) // Show video immediately

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return interests
    return interests.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
  }, [query])

  const handleVideoToggle = () => {
    const video = document.getElementById('hero-video') as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play().catch(err => {
          console.error('Failed to play video:', err)
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Material Design App Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                <img src={logo} alt="PathFinder Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">FastFinder</h1>
                <p className="text-xs text-gray-500">PovertyHack Initiative for Education</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewJobs?.()}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
              >
                <Briefcase className="w-4 h-4" />
                View Jobs
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Google style with video */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-8">
            {/* Left: Text Content */}
            <div className="max-w-3xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-gray-900 mb-4 tracking-tight leading-tight">
                Discover your <span className="font-semibold text-blue-600 whitespace-nowrap">future path</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed font-sans">
                Explore tailored education pathways designed for students who need a second chance. Find courses with details on fees, duration, and locations.
              </p>
              
              {/* Video Preview Card - Google Material Design */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
                  {/* Video Element - Autoplays */}
                  <video 
                    id="hero-video"
                    className="w-full h-full object-cover"
                    src={engineeringVideo}
                    poster={engineering}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onPlay={() => {
                      console.log('✅ Video playing')
                      setIsPlaying(true)
                      setShowVideo(true)
                    }}
                    onPause={() => {
                      console.log('⏸️ Video paused')
                      setIsPlaying(false)
                    }}
                    onEnded={() => {
                      console.log('🏁 Video ended')
                      setIsPlaying(false)
                    }}
                    onLoadedData={(e) => {
                      // Ensure video plays when loaded
                      const video = e.currentTarget
                      video.play().catch(err => {
                        console.error('Autoplay failed:', err)
                      })
                    }}
                    onError={(e) => {
                      console.error('❌ Video error:', e)
                      const video = e.currentTarget
                      console.error('Error details:', {
                        error: video.error,
                        src: video.src,
                        networkState: video.networkState,
                        readyState: video.readyState
                      })
                    }}
                  />
                  
                  {/* Play/Pause Overlay - Hidden initially since video autoplays */}
                  {!showVideo && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-blue-700 transition-all mb-3">
                          <Play className="w-10 h-10 text-white ml-1" fill="white" />
                        </div>
                        <p className="text-white text-sm font-medium drop-shadow-lg">Watch Introduction</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Control Button - Only shows on hover */}
                  <button
                    onClick={handleVideoToggle}
                    className="absolute inset-0 flex items-center justify-center bg-transparent hover:bg-black hover:bg-opacity-30 transition-all group cursor-pointer"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" fill="white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      )}
                    </div>
                  </button>
                </div>
                
                {/* Video Info */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      {/* <p className="text-xs text-gray-600">
                        {isPlaying ? 'Now playing' : 'See how education transforms lives'}
                      </p> */}
                    </div>
                    {/* {showVideo && (
                      <button
                        onClick={() => {
                          const video = document.getElementById('hero-video') as HTMLVideoElement
                          if (video) {
                            video.pause()
                            video.currentTime = 0
                            setShowVideo(false)
                            setIsPlaying(false)
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Reset
                      </button>
                    )} */}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Search Bar (moved here for better layout) */}
            <div className="lg:pl-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
                  placeholder="Search for IT, Engineering, Healthcare..."
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Quick Stats - Google style */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-2xl font-semibold text-blue-600">8</p>
                  <p className="text-xs text-gray-600 mt-1">Pathways</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-2xl font-semibold text-green-600">100+</p>
                  <p className="text-xs text-gray-600 mt-1">Programs</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-2xl font-semibold text-purple-600">∞</p>
                  <p className="text-xs text-gray-600 mt-1">Opportunities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-medium text-gray-900">Choose your interest</h3>
            <button
              onClick={() => setCompact(!compact)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Toggle view"
            >
              {compact ? <Grid3x3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span className="text-sm font-medium">{compact ? 'Grid' : 'List'}</span>
            </button>
          </div>

          {/* Material Cards Grid */}
          <div className={`grid gap-6 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filtered.map((interest) => {
              const Icon = interest.icon
              return (
                <button
                  key={interest.id}
                  onClick={() => onSelect(interest.id)}
                  className={`group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 text-left ${
                    compact ? 'flex items-center' : ''
                  }`}
                  style={{ '--accent-color': interest.color } as React.CSSProperties}
                >
                  {/* Image Container */}
                  <div className={`relative overflow-hidden ${compact ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48'}`}>
                    <img 
                      src={interest.image} 
                      alt={interest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {/* Floating Icon */}
                    {!compact && (
                      <div 
                        className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: interest.color }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`${compact ? 'flex-1 p-4' : 'p-5'}`}>
                    <h4 className="text-base font-display font-medium text-gray-900 mb-1 line-clamp-2">
                      {interest.name}
                    </h4>
                    {!compact && (
                      <p className="text-sm font-sans text-gray-600 mb-4">
                        Explore tailored programs and courses
                      </p>
                    )}
                    
                    {/* Action Button */}
                    <div className="flex items-center text-sm font-medium group-hover:gap-2 transition-all" style={{ color: interest.color }}>
                      <span>View pathways</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Ripple Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ backgroundColor: interest.color }}></div>
                </button>
              )
            })}
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pathways found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="text-sm font-display font-medium text-gray-900 mb-2">For Teachers & Counselors</h4>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              This tool helps guide students who didn't pass their O/L or A/L exams toward alternative education pathways. 
              Each pathway shows course details, fees, duration, and locations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
