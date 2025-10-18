import { useState } from 'react'
import { GraduationCap, Check, ArrowRight, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import motivationVideo from "../assets/engineering1.mp4"
import educationImage from "../assets/education.jpeg"

interface QualificationSelectionProps {
  interest: string
  onSelect: (qualification: string) => void
  onBack: () => void
}

interface QualificationOption {
  id: string
  title: string
  description: string
  badge: string
  color: string
  bgColor: string
  neo4jValue: string
}

const qualifications: QualificationOption[] = [
  {
    id: 'al-pass',
    title: 'Advanced Level',
    description: 'Passed G.C.E. (A/L) examination',
    badge: 'Passed',
    color: '#1e8e3e', // Google Green
    bgColor: '#e6f4ea',
    neo4jValue: 'G.C.E. (A/L) Examination Pass'
  },
  {
    id: 'al-attempt',
    title: 'Advanced Level',
    description: 'Attempted but not passed G.C.E. (A/L)',
    badge: 'Attempted',
    color: '#ea8600', // Google Orange
    bgColor: '#fef7e0',
    neo4jValue: 'G.C.E. (A/L) Examination Not Passed'
  },
  {
    id: 'ol-pass',
    title: 'Ordinary Level',
    description: 'Passed G.C.E. (O/L) examination',
    badge: 'Passed',
    color: '#1967d2', // Google Blue
    bgColor: '#e8f0fe',
    neo4jValue: 'G.C.E. (O/L) Examination Pass'
  },
  {
    id: 'ol-attempt',
    title: 'Ordinary Level',
    description: 'Did not pass G.C.E. (O/L)',
    badge: 'Not Passed',
    color: '#d93025', // Google Red
    bgColor: '#fce8e6',
    neo4jValue: 'G.C.E. (O/L) Examination Not Passed'
  }
]

export default function QualificationSelection({ interest, onSelect, onBack }: QualificationSelectionProps) {
  const [selectedQual, setSelectedQual] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true) // Start as true for autoplay
  const [showVideo, setShowVideo] = useState(true) // Show video immediately

  const handleSelect = (qualification: QualificationOption) => {
    setSelectedQual(qualification.id)
    // Add a small delay for visual feedback before navigation
    setTimeout(() => {
      onSelect(qualification.neo4jValue)
    }, 200)
  }

  const handleVideoToggle = () => {
    const video = document.getElementById('motivation-video') as HTMLVideoElement
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

  const handleVideoReset = () => {
    const video = document.getElementById('motivation-video') as HTMLVideoElement
    if (video) {
      video.pause()
      video.currentTime = 0
      setIsPlaying(false)
      // Restart the video
      setTimeout(() => {
        video.play().catch(err => {
          console.error('Failed to restart video:', err)
        })
      }, 100)
    }
  }

  // Format interest name for display
  const formatInterestName = (interest: string) => {
    return interest
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Google Material Design App Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{formatInterestName(interest)}</p>
                <p className="text-xs text-gray-500">Select qualification level</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section - Google style minimalist */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-normal text-gray-900 mb-3 tracking-tight">
              What's the student's current education level?
            </h1>
            <p className="text-base text-gray-600 max-w-2xl">
              Choose the qualification to see personalized pathways
            </p>
          </div>

          {/* Motivational Video Section - Google Material Design */}
          <div className="mb-12 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
              {/* Video Element - Autoplays */}
              <video 
                id="motivation-video"
                className="w-full h-full object-cover"
                src={motivationVideo}
                poster={educationImage}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onPlay={() => {
                  setIsPlaying(true)
                  setShowVideo(true)
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedData={(e) => {
                  // Ensure video plays when loaded
                  const video = e.currentTarget
                  video.play().catch(err => {
                    console.error('Autoplay failed:', err)
                  })
                }}
              />
              
              {/* Play/Pause Overlay - Hidden initially since video autoplays */}
              {!showVideo && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-blue-700 transition-all mb-3 cursor-pointer">
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                    <p className="text-white text-sm font-medium drop-shadow-lg">Every journey begins with a step</p>
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
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isPlaying ? '🎬 Inspiring stories of success' : '💪 Your education level is just the starting point'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Watch how students transform their lives through education
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Qualification Cards - Google Material Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {qualifications.map((qual) => {
              const isSelected = selectedQual === qual.id
              const isHovered = hoveredCard === qual.id

              return (
                <button
                  key={qual.id}
                  onClick={() => handleSelect(qual)}
                  onMouseEnter={() => setHoveredCard(qual.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    group relative bg-white rounded-xl border text-left
                    transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-600 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Title and Badge */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {qual.title}
                          </h3>
                          <span 
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{ 
                              backgroundColor: qual.bgColor,
                              color: qual.color
                            }}
                          >
                            {qual.badge}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {qual.description}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      <div 
                        className={`
                          ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          transition-all duration-200
                          ${isSelected 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300'
                          }
                        `}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>

                    {/* Action Hint */}
                    <div 
                      className={`
                        flex items-center gap-1 text-sm font-medium transition-colors duration-200
                        ${isSelected ? 'text-blue-600' : isHovered ? 'text-gray-900' : 'text-gray-500'}
                      `}
                    >
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                      <ArrowRight 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isHovered && !isSelected ? 'translate-x-0.5' : ''
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Selected Border Accent */}
                  {isSelected && (
                    <div 
                      className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                      style={{ backgroundColor: qual.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Info Card - Google style */}
          <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💡</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  How this helps
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  We'll show personalized education pathways based on the selected qualification level, including foundation programs, degree courses, and career opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
