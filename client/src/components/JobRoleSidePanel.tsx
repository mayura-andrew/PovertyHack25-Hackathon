import { useEffect, useState } from 'react'
import { 
  X, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Award,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Loader2,
  ChevronRight,
  Star,
  Target,
  Zap,
  Home,
  Calendar
} from 'lucide-react'

interface SkillCategory {
  technical: string[]
  soft: string[]
  tools: string[]
}

interface CareerPathInfo {
  entry_level: string
  mid_level: string
  senior_level: string
  years_to_advance: string
}

interface SalaryInfo {
  entry_level: string
  mid_level: string
  senior_level: string
  currency: string
}

interface WorkEnvironmentInfo {
  type: string
  remote_option: boolean
  industries: string[]
  company_types: string[]
}

interface LocalMarketInfo {
  demand: string
  top_companies: string[]
  growth_projection: string
  key_cities: string[]
}

interface JobRoleDetails {
  role_name: string
  overview: string
  key_responsibilities: string[]
  required_skills: SkillCategory
  career_path: CareerPathInfo
  salary_info: SalaryInfo
  work_environment: WorkEnvironmentInfo
  growth_opportunities: string[]
  certifications: string[]
  day_in_life: string[]
  local_market: LocalMarketInfo
}

interface JobRoleSidePanelProps {
  roleName: string
  programContext?: string
  onClose: () => void
}

export default function JobRoleSidePanel({ roleName, programContext, onClose }: JobRoleSidePanelProps) {
  const [jobDetails, setJobDetails] = useState<JobRoleDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'career' | 'market'>('overview')

  useEffect(() => {
    fetchJobDetails()
  }, [roleName, programContext])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (programContext) {
        params.append('program', programContext)
      }

      const response = await fetch(
        `http://localhost:8080/api/v1/pathway/job-roles/${encodeURIComponent(roleName)}?${params}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch job role details')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setJobDetails(data.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching job details:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modal Backdrop - Google-style subtle overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-[1px] transition-opacity z-40 flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Modal Container - Google Material Design 3 */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Compact Header - Google style */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">{roleName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Career Information & Market Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Minimal Tab Navigation - Google style */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'overview'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'skills'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Skills
            {activeTab === 'skills' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'career'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Career Path
            {activeTab === 'career' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'market'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          > 
            Market
            {activeTab === 'market' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content - Google-style clean layout */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-3"></div>
                <p className="text-gray-700 font-medium">Loading job details...</p>
                <p className="text-gray-500 text-sm mt-1">Please wait...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6 text-center border border-red-200">
                <div className="text-red-600 font-medium mb-2">Failed to load job details</div>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchJobDetails}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && jobDetails && (
            <div className="p-6 space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Overview Section - Google card style */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-medium text-gray-900">Role Overview</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{jobDetails.overview}</p>
                  </div>

                  {/* Key Responsibilities */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-base font-medium text-gray-900">Key Responsibilities</h3>
                    </div>
                    <ul className="space-y-2">
                      {jobDetails.key_responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-relaxed">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* A Day in the Life */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base font-medium text-gray-900">A Day in the Life</h3>
                    </div>
                    <div className="space-y-2">
                      {jobDetails.day_in_life.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Environment */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-medium text-gray-900">Work Environment</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-xs text-indigo-600 font-medium mb-1">Type</p>
                        <p className="text-gray-900 text-sm font-medium">{jobDetails.work_environment.type}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-xs text-indigo-600 font-medium mb-1">Remote Option</p>
                        <p className="text-gray-900 text-sm font-medium">
                          {jobDetails.work_environment.remote_option ? 'Available' : 'Not Available'}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 font-medium mb-2">Industries</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobDetails.work_environment.industries.map((industry, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-2">Company Types</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobDetails.work_environment.company_types.map((type, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {/* Technical Skills */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-medium text-gray-900">Technical Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {jobDetails.required_skills.technical.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <h3 className="text-base font-medium text-gray-900">Soft Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {jobDetails.required_skills.soft.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tools & Technologies */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base font-medium text-gray-900">Tools & Technologies</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {jobDetails.required_skills.tools.map((tool, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base font-medium text-gray-900">Recommended Certifications</h3>
                    </div>
                    <ul className="space-y-2">
                      {jobDetails.certifications.map((cert, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                          <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Career Path Tab */}
              {activeTab === 'career' && (
                <div className="space-y-6">
                  {/* Career Progression */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">Career Progression</h3>
                    </div>
                    <div className="space-y-4">
                      {/* Entry Level */}
                      <div className="relative pl-8 pb-6 border-l-4 border-green-300">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg" />
                        <div className="bg-green-50 p-4 rounded-xl">
                          <p className="text-xs text-green-600 font-semibold mb-1">Entry Level</p>
                          <p className="text-gray-900 font-bold text-lg">{jobDetails.career_path.entry_level}</p>
                        </div>
                      </div>
                      
                      {/* Mid Level */}
                      <div className="relative pl-8 pb-6 border-l-4 border-blue-300">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg" />
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Mid Level</p>
                          <p className="text-gray-900 font-bold text-lg">{jobDetails.career_path.mid_level}</p>
                        </div>
                      </div>
                      
                      {/* Senior Level */}
                      <div className="relative pl-8">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-purple-500 rounded-full border-4 border-white shadow-lg" />
                        <div className="bg-purple-50 p-4 rounded-xl">
                          <p className="text-xs text-purple-600 font-semibold mb-1">Senior Level</p>
                          <p className="text-gray-900 font-bold text-lg">{jobDetails.career_path.senior_level}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-indigo-700">Timeline: </span>
                        {jobDetails.career_path.years_to_advance}
                      </p>
                    </div>
                  </div>

                  {/* Salary Information */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-bold text-gray-900">Salary Expectations ({jobDetails.salary_info.currency})</h3>
                    </div>
                    <div className="grid gap-4">
                      <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                        <p className="text-xs text-emerald-600 font-semibold mb-1">Entry Level</p>
                        <p className="text-gray-900 font-bold text-xl">{jobDetails.salary_info.entry_level}</p>
                      </div>
                      <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                        <p className="text-xs text-emerald-600 font-semibold mb-1">Mid Level</p>
                        <p className="text-gray-900 font-bold text-xl">{jobDetails.salary_info.mid_level}</p>
                      </div>
                      <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                        <p className="text-xs text-emerald-600 font-semibold mb-1">Senior Level</p>
                        <p className="text-gray-900 font-bold text-xl">{jobDetails.salary_info.senior_level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Growth Opportunities */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">Growth Opportunities</h3>
                    </div>
                    <ul className="space-y-3">
                      {jobDetails.growth_opportunities.map((opportunity, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 leading-relaxed">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Market Insights Tab */}
              {activeTab === 'market' && (
                <div className="space-y-6">
                  {/* Market Demand */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">Market Demand</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg font-medium">
                      {jobDetails.local_market.demand}
                    </p>
                  </div>

                  {/* Growth Projection */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">Growth Projection</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{jobDetails.local_market.growth_projection}</p>
                  </div>

                  {/* Top Companies */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">Top Hiring Companies in Sri Lanka</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {jobDetails.local_market.top_companies.map((company, idx) => (
                        <div 
                          key={idx}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-gray-900 font-medium">{company}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Cities */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-bold text-gray-900">Key Job Locations</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {jobDetails.local_market.key_cities.map((city, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-200"
                        >
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-900 font-medium">{city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
