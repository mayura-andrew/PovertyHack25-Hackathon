import { Handle, Position } from '@xyflow/react'
import { Clock, Award, Building2, Briefcase, CheckCircle, BookOpen } from 'lucide-react'

export default function CourseNode({ data }: any) {
  // Google Material Design 3 color system - Enhanced with gradients
  const levelStyles: Record<string, { bg: string, badge: string, border: string, accent: string, iconBg: string }> = {
    requirement: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      border: 'border-amber-300 hover:border-amber-400',
      accent: 'bg-gradient-to-r from-amber-500 to-orange-500',
      iconBg: 'bg-amber-100'
    },
    beginner: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      badge: 'bg-green-100 text-green-800 border-green-300',
      border: 'border-green-300 hover:border-green-400',
      accent: 'bg-gradient-to-r from-green-500 to-emerald-500',
      iconBg: 'bg-green-100'
    },
    intermediate: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      border: 'border-blue-300 hover:border-blue-400',
      accent: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      iconBg: 'bg-blue-100'
    },
    advanced: {
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      border: 'border-purple-300 hover:border-purple-400',
      accent: 'bg-gradient-to-r from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100'
    },
    career: {
      bg: 'bg-gradient-to-br from-violet-50 to-fuchsia-50',
      badge: 'bg-violet-100 text-violet-800 border-violet-300',
      border: 'border-violet-300 hover:border-violet-400',
      accent: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
      iconBg: 'bg-violet-100'
    },
  }

  const style = levelStyles[data.level] || levelStyles.requirement
  
  // Determine if this node is clickable
  // Programs (beginner/intermediate/advanced) are clickable for learning roadmap
  // Career nodes are clickable for job role details
  const isProgramClickable = (data.level === 'beginner' || data.level === 'intermediate' || data.level === 'advanced') && data.onProgramClick
  const isCareerClickable = data.level === 'career' && data.onJobRoleClick
  const isClickable = isProgramClickable || isCareerClickable
  
  const handleClick = () => {
    if (isProgramClickable && data.onProgramClick) {
      console.log('Program clicked:', data.title)
      data.onProgramClick(data.title)
    } else if (isCareerClickable && data.onJobRoleClick) {
      console.log('Career clicked:', data.title)
      data.onJobRoleClick()
    }
  }

  return (
    <div 
      onClick={handleClick}
      className={`${style.bg} rounded-3xl shadow-lg border-2 ${style.border} p-8 min-w-[420px] max-w-[480px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      {/* Top accent bar - thicker and more prominent */}
      <div className={`${style.accent} h-2 rounded-full mb-6 -mt-5 -mx-5 shadow-sm`}></div>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-gray-400 !border-2 !border-white"
      />
      
      {data.label && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shadow-xl border-2 border-white">
          <span className="drop-shadow-sm">{data.label}</span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-semibold text-xl text-gray-900 mb-4 leading-snug min-h-[3rem] flex items-center">
          {data.title}
        </h3>
        
        {data.level && (
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 ${style.badge} shadow-sm`}>
            <Award className="w-4 h-4" />
            {data.type || data.level}
          </span>
        )}
      </div>

      <div className="space-y-4 text-sm">
        {data.institute && (
          <div className="flex items-start gap-3 text-gray-700 bg-white bg-opacity-60 p-3 rounded-xl">
            <div className={`${style.iconBg} p-2 rounded-lg`}>
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Institution</p>
              <span className="text-sm leading-relaxed font-medium">{data.institute}</span>
            </div>
          </div>
        )}
        
        {data.department && (
          <div className="flex items-start gap-3 text-gray-700 bg-white bg-opacity-60 p-3 rounded-xl">
            <div className={`${style.iconBg} p-2 rounded-lg`}>
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Department</p>
              <span className="text-sm leading-relaxed font-medium">{data.department}</span>
            </div>
          </div>
        )}

        {data.duration && (
          <div className="flex items-center gap-3 text-gray-700 bg-white bg-opacity-60 p-3 rounded-xl">
            <div className={`${style.iconBg} p-2 rounded-lg`}>
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Duration</p>
              <span className="text-sm font-medium">{data.duration}</span>
            </div>
          </div>
        )}

        {data.careers && (
          <div className="flex items-start gap-3 bg-blue-50 bg-opacity-80 p-4 rounded-xl border border-blue-100">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-semibold mb-1.5">Career Opportunities</p>
              <span className="text-sm leading-relaxed font-medium text-blue-700">{data.careers}</span>
            </div>
          </div>
        )}

        {data.requirements && (
          <div className="mt-5 p-4 bg-white bg-opacity-80 rounded-xl border-2 border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Entry Requirements
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.requirements}</p>
          </div>
        )}
      </div>

      {/* Action Buttons - Show for clickable nodes */}
      {isProgramClickable && (
        <div className="mt-6 pt-5 border-t-2 border-gray-200 border-dashed">
          <div className="flex items-center justify-center gap-2.5 text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 py-3 px-4 rounded-xl">
            <BookOpen className="w-5 h-5" />
            <span>View Free Learning Resources</span>
          </div>
        </div>
      )}
      
      {isCareerClickable && (
        <div className="mt-6 pt-5 border-t-2 border-gray-200 border-dashed">
          <div className="flex items-center justify-center gap-2.5 text-base font-semibold text-violet-600 hover:text-violet-700 transition-colors bg-violet-50 hover:bg-violet-100 py-3 px-4 rounded-xl">
            <Briefcase className="w-5 h-5" />
            <span>View Career Details</span>
          </div>
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  )
}
