import { useEffect, useState, useRef } from 'react'
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, useReactFlow, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, Play, RotateCcw, Loader2 } from 'lucide-react'
import CourseNode from './CourseNode'
import JobRoleSidePanel from './JobRoleSidePanel'
import { pathwayApi } from '../services/pathwayApi'
import { transformProgramsToFlow } from '../utils/pathwayTransform'

interface EducationRoadmapProps {
  interest: string
  qualification: string
  onBack: () => void
  onProgramSelect?: (programName: string) => void
}

const nodeTypes = {
  course: CourseNode,
}

// Mock data for demo purposes (fallback if API fails)
function createMockEngineeringData() {
  return [
    {
      name: 'Advanced Certificate in Science',
      institute: 'The Open University of Sri Lanka',
      department: 'Faculty of Engineering Technology',
      requirements: [
        { name: 'G.C.E. (O/L) Examination Pass' },
        { name: 'Age Requirement' }
      ],
      prerequisites: [],
      career_paths: []
    },
    {
      name: 'ICT Technician (NVQ Level 3)',
      institute: 'Vocational Training Authority (VTA)',
      department: 'ICT',
      requirements: [{ name: 'G.C.E. (O/L) Examination Not Passed' }],
      prerequisites: [],
      career_paths: []
    },
    {
      name: 'Computer Hardware Technician (NVQ Level 4)',
      institute: 'Vocational Training Authority (VTA)',
      department: 'ICT',
      requirements: [{ name: 'Completion of NVQ Level 3 Program' }],
      prerequisites: [{ name: 'ICT Technician (NVQ Level 3)' }],
      career_paths: [{ title: 'Hardware Engineer' }]
    },
    {
      name: 'Bachelor of Software Engineering Honours',
      institute: 'The Open University of Sri Lanka',
      department: 'Electrical and Computer Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [
        { title: 'Software Engineer' },
        { title: 'Quality Assurance Engineer' },
        { title: 'DevOps Engineer' }
      ]
    },
    {
      name: 'BSc Honours in Engineering - Computer Engineering',
      institute: 'The Open University of Sri Lanka',
      department: 'Electrical and Computer Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [
        { title: 'Software Engineer' },
        { title: 'Hardware Engineer' },
        { title: 'Network Administrator' }
      ]
    },
    {
      name: 'BSc Honours in Engineering - Electrical Engineering',
      institute: 'The Open University of Sri Lanka',
      department: 'Electrical and Computer Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [{ title: 'Electrical Engineer' }]
    },
    {
      name: 'BSc Honours in Engineering - Electronics and Communication Engineering',
      institute: 'The Open University of Sri Lanka',
      department: 'Electrical and Computer Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [{ title: 'Electronics Engineer' }]
    },
    {
      name: 'Civil Engineering Degree Programme',
      institute: 'The Open University of Sri Lanka',
      department: 'Civil Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [
        { title: 'Civil Engineer' },
        { title: 'Structural Engineer' }
      ]
    },
    {
      name: 'Mechanical Engineering Degree Programme',
      institute: 'The Open University of Sri Lanka',
      department: 'Mechanical Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [{ title: 'Mechanical Engineer' }]
    },
    {
      name: 'Mechatronics Engineering Degree Programme',
      institute: 'The Open University of Sri Lanka',
      department: 'Mechanical Engineering',
      requirements: [
        { name: 'Completion of Advanced Certificate in Science' },
        { name: 'G.C.E. (A/L) Examination Pass' }
      ],
      prerequisites: [{ name: 'Advanced Certificate in Science' }],
      career_paths: [{ title: 'Mechatronics Engineer' }]
    }
  ]
}

// Map interests to departments
const interestToDepartment: Record<string, string> = {
  'engineering-and-technology': 'Electrical and Computer Engineering',
  'information-technology': 'Electrical and Computer Engineering',
  'construction-and-quantity-survey': 'Civil Engineering',
  'agriculture-and-aquatic-resources': 'Agricultural and Plantation Engineering',
  'healthcare-and-medical-science': 'Healthcare',
  'business-and-management': 'Business',
  'education-and-childcare': 'Education',
  'hospitality-and-tourism': 'Tourism'
}

export default function EducationRoadmap({ interest, qualification, onBack, onProgramSelect }: EducationRoadmapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [allNodes, setAllNodes] = useState<Node[]>([])
  const [allEdges, setAllEdges] = useState<Edge[]>([])
  const [selectedJobRole, setSelectedJobRole] = useState<string | null>(null)
  const [jobProgramContext, setJobProgramContext] = useState<string>('')
  const intervalRef = useRef<number | null>(null)
  const { fitView } = useReactFlow()

  // Handler for job role clicks
  const handleJobRoleClick = (roleName: string, programContext?: string) => {
    console.log('Job role clicked:', roleName, 'Context:', programContext)
    setSelectedJobRole(roleName)
    setJobProgramContext(programContext || interest.replace(/-/g, ' '))
  }

  // Fetch data from API using qualification-based endpoint
  useEffect(() => {
    const fetchPathwayData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const department = interestToDepartment[interest] || 'Electrical and Computer Engineering'
        
        console.log('=== PATHWAY FETCH START (Qualification-Based) ===')
        console.log(`Interest selected: ${interest}`)
        console.log(`Department: ${department}`)
        console.log(`Qualification: ${qualification}`)
        
        let programs: any[] = []
        
        try {
          // Use the new qualification-based API
          programs = await pathwayApi.getPathwayByQualification(department, qualification)
          console.log(`✅ API Response received: ${programs.length} programs for qualification`)
        } catch (apiError) {
          console.error('❌ API Error:', apiError)
          
          // FALLBACK: If API fails, use mock data for engineering for demo
          if (interest === 'engineering-and-technology') {
            console.warn('⚠️ Using MOCK DATA for engineering demo')
            programs = createMockEngineeringData()
          } else {
            throw apiError
          }
        }
        
        console.log('Programs received:', programs.map(p => `${p.name} (${p.department || 'N/A'})`))
        
        if (programs.length === 0) {
          throw new Error(`No programs available for ${interest} with qualification "${qualification}". Try a different qualification level.`)
        }

        // Pass the onProgramSelect callback to enable program clicks and job role clicks
        const { nodes: flowNodes, edges: flowEdges } = transformProgramsToFlow(
          programs, 
          onProgramSelect,
          handleJobRoleClick
        )
        
        console.log(`🎨 Generated ${flowNodes.length} nodes and ${flowEdges.length} edges`)
        console.log('=== PATHWAY FETCH COMPLETE ===')
        
        setAllNodes(flowNodes)
        setAllEdges(flowEdges)
        setIsLoading(false)
        
        // Auto-start animation after a short delay
        setTimeout(() => {
          if (flowNodes.length > 0) {
            console.log('🎬 Starting animation...')
            startAnimation(flowNodes, flowEdges)
          } else {
            console.warn('⚠️ No nodes to animate')
          }
        }, 500)
      } catch (err) {
        console.error('❌ FATAL ERROR:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pathway data. Please check if backend is running.')
        setIsLoading(false)
      }
    }

    fetchPathwayData()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interest, qualification])

  const startAnimation = (nodesToAnimate: Node[] = allNodes, edgesToAnimate: Edge[] = allEdges) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    // If no nodes to animate, just show all immediately
    if (nodesToAnimate.length === 0) {
      console.warn('No nodes to animate')
      setIsAnimating(false)
      return
    }
    
    setIsAnimating(true)
    setCurrentStep(0)
    setNodes([])
    setEdges([])
    
    let step = 0
    intervalRef.current = setInterval(() => {
      if (step < nodesToAnimate.length) {
        setNodes(prev => {
          const newNodes = [...prev, nodesToAnimate[step]]
          setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100)
          return newNodes
        })
        
        setEdges(prev => {
          const newNodeId = nodesToAnimate[step].id
          const relevantEdges = edgesToAnimate.filter(edge => 
            edge.target === newNodeId && [...prev.map(e => e.source), newNodeId].includes(edge.source)
          )
          return [...prev, ...relevantEdges]
        })
        
        setCurrentStep(step + 1)
        step++
      } else {
        setIsAnimating(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        // Final fit view after animation completes
        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 200)
      }
    }, 800)
  }

  const resetAnimation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setNodes(allNodes)
    setEdges(allEdges)
    setIsAnimating(false)
    setCurrentStep(allNodes.length)
    setTimeout(() => fitView({ padding: 0.1 }), 100)
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading pathway data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-2xl px-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 mb-6 shadow-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-700 font-bold text-xl mb-3">Unable to Load Pathway Data</p>
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="bg-white rounded-lg p-4 text-left text-sm">
              <p className="font-semibold text-gray-900 mb-2">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Check if backend server is running on port 8080</li>
                <li>Verify Neo4j database is running and populated</li>
                <li>Check browser console for detailed errors</li>
                <li>Try: <code className="bg-gray-100 px-2 py-1 rounded">curl http://localhost:8080/health</code></li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Google-style minimal header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-normal text-gray-900 capitalize">
              {interest.replace(/-/g, ' ')} Pathway
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              For students with: <span className="font-medium text-gray-700">{qualification}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => startAnimation()} 
              disabled={isAnimating}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all"
            >
              <Play className="w-4 h-4" />
              Animate
            </button>
            <button 
              onClick={resetAnimation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Show All
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          className="bg-transparent"
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background 
            color="#cbd5e1" 
            gap={24} 
            size={1.5}
            style={{ opacity: 0.4 }}
          />
          <Controls className="bg-white border-2 border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-shadow" />
        </ReactFlow>
        
        {isAnimating && (
          <div className="absolute top-8 right-8 bg-white border-2 border-blue-200 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm bg-white/95">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Building Your Pathway</p>
                <p className="text-xs text-gray-600 mt-1">
                  Step {currentStep} of {allNodes.length}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Legend - Enhanced Google Material Design */}
        {!isAnimating && nodes.length > 0 && (
          <div className="absolute bottom-8 left-8 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-6 max-w-sm backdrop-blur-sm bg-white/95">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              Pathway Stages
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Entry Qualifications</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Foundation Programs</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Degree Programs</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm"></div>
                <span className="text-sm text-gray-700 font-medium">Career Outcomes</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">💡 Click program cards to view free learning resources</p>
              <p className="text-xs text-gray-500 italic mt-1">💼 Click career outcomes for detailed job information</p>
            </div>
          </div>
        )}
      </div>

      {/* Job Role Side Panel */}
      {selectedJobRole && (
        <JobRoleSidePanel
          roleName={selectedJobRole}
          programContext={jobProgramContext}
          onClose={() => setSelectedJobRole(null)}
        />
      )}
    </div>
  )
}
