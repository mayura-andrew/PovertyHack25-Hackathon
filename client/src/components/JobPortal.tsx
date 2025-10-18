import { useState, useMemo } from 'react'
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  X,
  ChevronRight,
  Star,
  Home,
  Building,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import jobsData from '../data/jobs.json'
import logo from '../assets/logo.png'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  experience: string
  salary: string
  posted: string
  description: string
  requirements: string[]
  responsibilities: string[]
  pathway: string
  qualifications: string[]
  skills: string[]
  logo: string
  featured: boolean
  remote: boolean
  benefits: string[]
}

interface JobPortalProps {
  selectedPathway?: string
  onBack?: () => void
  onViewLearningPath?: (pathway: string) => void
}

export default function JobPortal({ selectedPathway, onBack, onViewLearningPath }: JobPortalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [filters, setFilters] = useState({
    type: 'all',
    remote: 'all',
    experience: 'all'
  })

  const jobs = jobsData as Job[]

  const filteredJobs = useMemo(() => {
    let result = jobs

    // Filter by pathway if provided
    if (selectedPathway && selectedPathway !== 'all') {
      result = result.filter(job => job.pathway === selectedPathway)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.skills.some(skill => skill.toLowerCase().includes(query))
      )
    }

    // Filter by type
    if (filters.type !== 'all') {
      result = result.filter(job => job.type.toLowerCase() === filters.type)
    }

    // Filter by remote
    if (filters.remote === 'remote') {
      result = result.filter(job => job.remote)
    } else if (filters.remote === 'onsite') {
      result = result.filter(job => !job.remote)
    }

    // Filter by experience
    if (filters.experience !== 'all') {
      if (filters.experience === 'entry') {
        result = result.filter(job => job.experience.includes('0'))
      } else if (filters.experience === 'mid') {
        result = result.filter(job => job.experience.includes('1') || job.experience.includes('2'))
      }
    }

    // Sort featured first
    return result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  }, [jobs, searchQuery, filters, selectedPathway])

  const pathwayNames: Record<string, string> = {
    'engineering-and-technology': 'Engineering & Technology',
    'healthcare-and-medical-science': 'Healthcare & Medical Science',
    'information-technology': 'Information Technology',
    'hospitality-and-tourism': 'Hospitality & Tourism',
    'business-and-management': 'Business & Management',
    'education-and-childcare': 'Education & Childcare',
    'construction-and-quantity-survey': 'Construction & Quantity Survey',
    'agriculture-and-aquatic-resources': 'Agriculture & Aquatic Resources'
  }

  if (selectedJob) {
    return <JobDetails job={selectedJob} onBack={() => setSelectedJob(null)} onViewLearningPath={onViewLearningPath} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                <img src={logo} alt="FastFinder Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">Job Portal</h1>
                <p className="text-xs text-gray-500">Find opportunities that match your skills</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-sm text-blue-700 font-medium">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {selectedPathway && selectedPathway !== 'all'
                ? `Jobs in ${pathwayNames[selectedPathway]}`
                : 'Your Next Opportunity Awaits'}
            </h2>
            <p className="text-lg text-blue-100">
              Discover entry-level positions perfect for vocational graduates and career starters
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by job title, company, location, or skills..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {/* Job Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
            </select>

            {/* Remote Filter */}
            <select
              value={filters.remote}
              onChange={(e) => setFilters({ ...filters, remote: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
            </select>

            {/* Experience Filter */}
            <select
              value={filters.experience}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Experience</option>
              <option value="entry">Entry Level (0-1 years)</option>
              <option value="mid">1-3 years</option>
            </select>

            {/* Clear Filters */}
            {(filters.type !== 'all' || filters.remote !== 'all' || filters.experience !== 'all') && (
              <button
                onClick={() => setFilters({ type: 'all', remote: 'all', experience: 'all' })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {selectedPathway && selectedPathway !== 'all' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Looking for training? 
              <button
                onClick={() => onViewLearningPath?.(selectedPathway)}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline"
              >
                View learning pathways for this field
              </button>
            </p>
          </div>
        )}

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ type: 'all', remote: 'all', experience: 'all' })
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Job Card Component
function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            {/* Company Logo */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
              {job.logo}
            </div>

            {/* Title and Company */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {job.title}
                </h3>
                {job.featured && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {job.type}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.experience}
            </span>
            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
              <DollarSign className="w-4 h-4" />
              {job.salary}
            </span>
            {job.remote && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <Home className="w-4 h-4" />
                Remote
              </span>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Posted {job.posted}</span>
            <span className="group-hover:text-blue-600 inline-flex items-center gap-1 font-medium">
              View details
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

// Job Details Component
function JobDetails({ job, onBack, onViewLearningPath }: { job: Job; onBack: () => void; onViewLearningPath?: (pathway: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-base font-medium text-gray-900">Job Details</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl flex-shrink-0">
              {job.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                {job.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-600 font-medium mb-4">{job.company}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {job.type}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {job.experience}
                </span>
                {job.remote && (
                  <span className="inline-flex items-center gap-2 text-blue-600 font-medium">
                    <Home className="w-4 h-4" />
                    Remote
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Salary Range</p>
              <p className="text-xl font-semibold text-green-600">{job.salary}</p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2">
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Learning Path Connection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Build Your Skills</h3>
              <p className="text-sm text-gray-600">Prepare for this role with our learning pathways</p>
            </div>
          </div>
          <button
            onClick={() => onViewLearningPath?.(job.pathway)}
            className="w-full px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            View Related Learning Pathways
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About this role</h2>
          <p className="text-gray-700 leading-relaxed">{job.description}</p>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
          <ul className="space-y-3">
            {job.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Responsibilities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
          <ul className="space-y-3">
            {job.responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-3">
            {job.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {job.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Apply?</h3>
          <p className="text-blue-100 mb-6">Join {job.company} and start your career journey today</p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors font-semibold inline-flex items-center gap-2">
            Apply for this position
            <ExternalLink className="w-5 h-5" />
          </button>
          <p className="text-sm text-blue-200 mt-4">Posted {job.posted}</p>
        </div>
      </main>
    </div>
  )
}
