import { type Node, type Edge, MarkerType } from '@xyflow/react'
import { type Program, type Pathway } from '../services/pathwayApi'

// Create a structured pathway flow showing progression from qualifications → prerequisites → programs → careers
export function transformProgramsToFlow(
  programs: Program[], 
  onProgramClick?: (programName: string) => void,
  onJobRoleClick?: (roleName: string, programContext?: string) => void
): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, string>() // Map to track created nodes by name
  
  // Increased spacing for Google Material Design feel
  const ySpacing = 350 // Vertical spacing between layers (was 250)
  const xSpacing = 520 // Horizontal spacing between nodes (was 380)
  let layerY = 50 // Start with some top padding

  // Layer 1: Extract all unique qualifications (O/L, Age requirements, etc.)
  const qualifications = new Set<string>()
  programs.forEach(program => {
    program.requirements?.forEach(req => qualifications.add(req.name))
  })
  
  const qualArray = Array.from(qualifications)
  qualArray.forEach((qual, index) => {
    const nodeId = `qual-${index}`
    nodeMap.set(qual, nodeId)
    nodes.push({
      id: nodeId,
      type: 'course',
      position: { x: index * xSpacing + 100, y: layerY },
      data: {
        title: qual,
        level: 'requirement',
        type: 'Entry Qualification',
        label: index === 0 ? '🎯 Start Here' : undefined
      }
    })
  })

  layerY += ySpacing

  // Layer 2: Identify prerequisite programs (Advanced Certificate, NVQ programs)
  const prerequisitePrograms = programs.filter(p => 
    p.name.includes('Advanced Certificate') || 
    p.name.includes('NVQ') ||
    p.prerequisites?.length === 0 && !p.name.includes('Bachelor') && !p.name.includes('BSc')
  )
  
  prerequisitePrograms.forEach((program, index) => {
    const nodeId = `prereq-${index}`
    nodeMap.set(program.name, nodeId)
    
    const xPos = index * xSpacing + 100 + (xSpacing * qualArray.length) / 6
    
    nodes.push({
      id: nodeId,
      type: 'course',
      position: { x: xPos, y: layerY },
      data: {
        title: program.name,
        institute: program.institute,
        department: program.department,
        level: 'beginner',
        type: 'Foundation Program',
        duration: '1-2 years',
        onProgramClick: onProgramClick // Add click handler
      }
    })

    // Connect qualifications to prerequisites with enhanced styling
    program.requirements?.forEach(req => {
      const sourceId = nodeMap.get(req.name)
      if (sourceId) {
        edges.push({
          id: `${sourceId}-to-${nodeId}`,
          source: sourceId,
          target: nodeId,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3, strokeDasharray: '0' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 24, height: 24 }
        })
      }
    })
  })

  layerY += ySpacing

  // Layer 3: Main degree programs (Bachelor's, BSc Honours)
  const degreePrograms = programs.filter(p => 
    p.name.includes('Bachelor') || 
    p.name.includes('BSc') ||
    (p.prerequisites && p.prerequisites.length > 0)
  )
  
  degreePrograms.forEach((program, index) => {
    const nodeId = `degree-${index}`
    nodeMap.set(program.name, nodeId)
    
    const xPos = index * (xSpacing * 0.95) + 100
    
    nodes.push({
      id: nodeId,
      type: 'course',
      position: { x: xPos, y: layerY },
      data: {
        title: program.name,
        institute: program.institute,
        department: program.department,
        level: 'intermediate',
        type: 'Bachelor\'s Degree',
        duration: '4 years',
        careers: program.career_paths?.map(c => c.title).join(', ') || 'Engineering Careers',
        onProgramClick: onProgramClick // Add click handler
      }
    })

    // Connect prerequisites to degree programs with enhanced styling
    program.prerequisites?.forEach(prereq => {
      const sourceId = nodeMap.get(prereq.name)
      if (sourceId) {
        edges.push({
          id: `${sourceId}-to-${nodeId}`,
          source: sourceId,
          target: nodeId,
          animated: true,
          style: { stroke: '#2563eb', strokeWidth: 3.5, strokeDasharray: '0' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb', width: 26, height: 26 }
        })
      }
    })

    // If no prerequisites, connect to Advanced Certificate (common entry path)
    if (!program.prerequisites || program.prerequisites.length === 0) {
      const advCertNode = nodeMap.get('Advanced Certificate in Science')
      if (advCertNode) {
        edges.push({
          id: `${advCertNode}-to-${nodeId}`,
          source: advCertNode,
          target: nodeId,
          animated: true,
          style: { stroke: '#2563eb', strokeWidth: 3.5, strokeDasharray: '0' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb', width: 26, height: 26 }
        })
      }
    }
  })

  layerY += ySpacing

  // Layer 4: Career paths with click handlers
  const careers = new Set<string>()
  const careerToProgramMap = new Map<string, string[]>() // Track which programs lead to each career
  
  programs.forEach(program => {
    program.career_paths?.forEach(career => {
      careers.add(career.title)
      if (!careerToProgramMap.has(career.title)) {
        careerToProgramMap.set(career.title, [])
      }
      careerToProgramMap.get(career.title)?.push(program.name)
    })
  })
  
  const careerArray = Array.from(careers)
  careerArray.forEach((career, index) => {
    const nodeId = `career-${index}`
    const xPos = index * xSpacing + 150
    const relatedPrograms = careerToProgramMap.get(career) || []
    const programContext = relatedPrograms.length > 0 ? relatedPrograms[0] : 'General career path'
    
    nodes.push({
      id: nodeId,
      type: 'course',
      position: { x: xPos, y: layerY },
      data: {
        title: career,
        level: 'career',
        type: '🎓 Career Outcome',
        label: index === 0 ? '💼 Your Future' : undefined,
        onJobRoleClick: onJobRoleClick ? () => onJobRoleClick(career, programContext) : undefined
      }
    })

    // Connect programs to careers with enhanced styling
    degreePrograms.forEach((program, pIndex) => {
      if (program.career_paths?.some(c => c.title === career)) {
        const sourceId = `degree-${pIndex}`
        edges.push({
          id: `${sourceId}-to-${nodeId}`,
          source: sourceId,
          target: nodeId,
          animated: true,
          style: { stroke: '#7c3aed', strokeWidth: 4, strokeDasharray: '0' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed', width: 28, height: 28 }
        })
      }
    })
  })

  return { nodes, edges }
}

export function transformPathwayToFlow(pathway: Pathway): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let currentY = 0
  const ySpacing = 180

  // Add qualifications at top
  pathway.qualifications.forEach((qual, index) => {
    nodes.push({
      id: `qual-${index}`,
      type: 'course',
      position: { x: 250 + index * 100, y: currentY },
      data: {
        label: index === 0 ? 'Start Here' : undefined,
        title: qual.name,
        level: 'beginner',
        type: 'Qualification'
      }
    })
  })

  currentY += ySpacing

  // Add programs in middle
  pathway.programs.forEach((program, index) => {
    const programId = `program-${index}`
    nodes.push({
      id: programId,
      type: 'course',
      position: { x: 250 + index * 150, y: currentY },
      data: {
        title: program.name,
        institute: pathway.institute,
        department: pathway.department,
        level: 'intermediate'
      }
    })

    // Connect qualifications to programs
    pathway.qualifications.forEach((_, qualIndex) => {
      edges.push({
        id: `qual-${qualIndex}-to-${programId}`,
        source: `qual-${qualIndex}`,
        target: programId,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      })
    })
  })

  currentY += ySpacing

  // Add careers at bottom
  pathway.careers.forEach((career, index) => {
    const careerId = `career-${index}`
    nodes.push({
      id: careerId,
      type: 'course',
      position: { x: 250 + index * 150, y: currentY },
      data: {
        title: career.title,
        level: 'advanced',
        type: 'Career'
      }
    })

    // Connect programs to careers
    pathway.programs.forEach((_, programIndex) => {
      edges.push({
        id: `program-${programIndex}-to-${careerId}`,
        source: `program-${programIndex}`,
        target: careerId,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      })
    })
  })

  return { nodes, edges }
}
