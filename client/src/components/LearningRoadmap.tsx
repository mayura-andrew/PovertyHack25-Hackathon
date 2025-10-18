import { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, Clock, TrendingUp, Play, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Video {
  video_id: string;
  title: string;
  url: string;
  channel: string;
  duration: string;
  view_count: number;
  published_at: string;
  thumbnail: string;
  description: string;
}

interface LearningStep {
  step_number: number;
  title: string;
  description: string;
  topics: string[];
  duration: string;
  difficulty: string;
  videos: Video[];
}

interface RoadmapData {
  program_name: string;
  overview: string;
  total_duration: string;
  prerequisites: string[];
  key_skills: string[];
  recommended_for: string;
  steps: LearningStep[];
}

interface Props {
  programName: string;
  onBack: () => void;
}

export default function LearningRoadmap({ programName, onBack }: Props) {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1])); // First step expanded by default

  useEffect(() => {
    fetchRoadmap();
  }, [programName]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8080/api/v1/pathway/programs/${encodeURIComponent(programName)}/learning-roadmap`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch learning roadmap');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setRoadmap(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching roadmap:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#1a73e8] border-r-transparent mb-4"></div>
          <p className="text-gray-600">Generating your personalized learning roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#1a73e8] hover:underline mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Programs
          </button>
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
            <p className="text-red-600 mb-4">Failed to load learning roadmap</p>
            <button
              onClick={fetchRoadmap}
              className="px-6 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#1a73e8] hover:underline mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Programs
        </button>

        {/* Program Overview */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 mb-6">
          <h1 className="text-3xl font-normal text-[#202124] mb-4">
            {roadmap.program_name}
          </h1>
          <p className="text-gray-600 mb-6">{roadmap.overview}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#1a73e8]" />
              <div>
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="font-medium text-gray-900">{roadmap.total_duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#1a73e8]" />
              <div>
                <p className="text-sm text-gray-500">Recommended For</p>
                <p className="font-medium text-gray-900">{roadmap.recommended_for}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#1a73e8]" />
              <div>
                <p className="text-sm text-gray-500">Learning Steps</p>
                <p className="font-medium text-gray-900">{roadmap.steps.length} Steps</p>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          {roadmap.prerequisites.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Prerequisites</h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.prerequisites.map((prereq, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-300"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Skills */}
          {roadmap.key_skills.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Key Skills You'll Learn</h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.key_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Learning Steps */}
        <div className="space-y-4">
          {roadmap.steps.map((step) => {
            const isExpanded = expandedSteps.has(step.step_number);
            
            return (
              <div
                key={step.step_number}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(step.step_number)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-medium">
                      {step.step_number}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {step.duration}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(step.difficulty)}`}>
                          {step.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Step Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <p className="text-gray-600 mt-4 mb-4">{step.description}</p>

                    {/* Topics */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {step.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Video Resources */}
                    {step.videos && step.videos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Play className="w-5 h-5 text-[#1a73e8]" />
                          Recommended Video Resources
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {step.videos.slice(0, 4).map((video) => (
                            <a
                              key={video.video_id}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#1a73e8] hover:shadow-md transition-all group"
                            >
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-32 h-20 object-cover rounded flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-[#1a73e8]">
                                  {video.title}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">{video.channel}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{video.duration}</span>
                                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#1a73e8]" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No videos message */}
                    {(!step.videos || step.videos.length === 0) && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          📚 Video resources temporarily unavailable. Please check the resources list or search YouTube for: <strong>{step.title}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
