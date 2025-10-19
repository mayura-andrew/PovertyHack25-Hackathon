import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Clock, Target, Video, Lightbulb, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { pathwayApi } from '../services/pathwayApi'

interface LearningStep {
  step_number: number
  title: string
  description: string
  topics: string[]
  duration: string
  difficulty: string
  videos?: Array<{
    title: string
    url: string
    thumbnail?: string
    duration?: string
  }>
}

interface LearningRoadmap {
  program_name: string
  overview: string
  total_duration: string
  prerequisites: string[]
  key_skills: string[]
  recommended_for: string
  steps: LearningStep[]
}

interface LearningRoadmapViewProps {
  programName: string
  onBack: () => void
}

export default function LearningRoadmapView({ programName, onBack }: LearningRoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'cache' | 'fresh' | null>(null)

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(`🔍 Fetching roadmap for: ${programName}`)
        
        // STRATEGY: Try cached first for instant response, fallback to fresh generation
        let data = null
        
        try {
          data = await pathwayApi.getCachedLearningRoadmap(programName)
          if (data) {
            console.log('✅ Loaded from cache')
            setDataSource('cache')
          }
        } catch (cacheError) {
          console.warn('⚠️ Cache miss, trying fresh generation:', cacheError)
        }

        // If no cached data, try fast generation
        if (!data) {
          try {
            console.log('🚀 Generating fresh roadmap...')
            data = await pathwayApi.getLearningRoadmapFast(programName)
            console.log('✅ Fresh roadmap generated')
            setDataSource('fresh')
          } catch (freshError) {
            console.error('❌ Fresh generation failed:', freshError)
            throw new Error('Unable to load or generate learning roadmap. Please try again later.')
          }
        }

        setRoadmap(data)
      } catch (err) {
        console.error('❌ Failed to fetch roadmap:', err)
        setError(err instanceof Error ? err.message : 'Failed to load learning roadmap')
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmap()
  }, [programName])

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // Handle youtu.be/VIDEO_ID format
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
    if (shortMatch) return shortMatch[1]
    
    // Handle youtube.com/watch?v=VIDEO_ID format
    const longMatch = url.match(/[?&]v=([^&]+)/)
    if (longMatch) return longMatch[1]
    
    // Handle youtube.com/embed/VIDEO_ID format
    const embedMatch = url.match(/embed\/([^?&]+)/)
    if (embedMatch) return embedMatch[1]
    
    return null
  }

  // Difficulty color mapping
  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase()
    if (lower.includes('beginner') || lower.includes('easy')) return 'text-green-600 bg-green-100 border-green-300'
    if (lower.includes('intermediate') || lower.includes('medium')) return 'text-blue-600 bg-blue-100 border-blue-300'
    if (lower.includes('advanced') || lower.includes('hard')) return 'text-purple-600 bg-purple-100 border-purple-300'
    return 'text-gray-600 bg-gray-100 border-gray-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Your Learning Path...</h2>
          <p className="text-gray-600">Preparing personalized resources for {programName}</p>
        </div>
      </div>
    )
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Pathway</span>
          </button>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Roadmap</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Pathway</span>
          </button>

          {dataSource === 'cache' && (
            <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" />
              Showing cached data
            </div>
          )}
        </div>

        {/* Program Overview Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-2 border-gray-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.program_name}</h1>
              <p className="text-gray-600 leading-relaxed">{roadmap.overview}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="font-semibold text-gray-900">{roadmap.total_duration}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Learning Steps</p>
                  <p className="font-semibold text-gray-900">{roadmap.steps.length} Steps</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Recommended For</p>
                  <p className="font-semibold text-gray-900 text-sm">{roadmap.recommended_for}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prerequisites & Key Skills */}
          {(roadmap.prerequisites.length > 0 || roadmap.key_skills.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {roadmap.prerequisites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Prerequisites
                  </h3>
                  <ul className="space-y-2">
                    {roadmap.prerequisites.map((prereq, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {roadmap.key_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Key Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.key_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium border border-purple-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Learning Steps */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Learning Journey</h2>

          {roadmap.steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-200 hover:shadow-xl transition-shadow"
            >
              {/* Step Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.step_number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{step.description}</p>

                  {/* Step Meta Info */}
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200">
                      <Clock className="w-4 h-4" />
                      {step.duration}
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getDifficultyColor(step.difficulty)}`}>
                      {step.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Topics */}
              {step.topics.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Topics Covered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {step.topics.map((topic, topicIdx) => (
                      <span
                        key={topicIdx}
                        className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {step.videos && step.videos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-red-600" />
                    Learning Resources ({step.videos.length} Videos)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {step.videos.map((video, videoIdx) => {
                      const videoId = getYouTubeVideoId(video.url)
                      return (
                        <div
                          key={videoIdx}
                          className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-red-400 transition-all"
                        >
                          {videoId ? (
                            <div className="aspect-video">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={video.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-200 flex items-center justify-center">
                              <Video className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="p-4">
                            <p className="font-medium text-gray-900 text-sm line-clamp-2">
                              {video.title}
                            </p>
                            {video.duration && (
                              <p className="text-xs text-gray-500 mt-1">{video.duration}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No Videos Message */}
              {(!step.videos || step.videos.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Video resources are being curated for this step. Check back later!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
