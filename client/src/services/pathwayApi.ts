const API_BASE_URL = 'http://localhost:8080/api/v1'

export interface Program {
  name: string
  institute?: string
  faculty?: string
  department?: string
  requirements?: Array<{ name: string }>
  prerequisites?: Array<{ name: string }>
  career_paths?: Array<{ title: string }>
}

export interface Career {
  title: string
}

export interface Pathway {
  programs: Array<{ name: string }>
  qualifications: Array<{ name: string }>
  careers: Array<{ title: string }>
  institute: string
  faculty: string
  department: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  error?: string
}

export const pathwayApi = {
  // Get all institutes
  async getInstitutes(): Promise<Array<{ name: string }>> {
    const response = await fetch(`${API_BASE_URL}/pathway/institutes`)
    const json: ApiResponse<Array<{ name: string }>> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Get programs by institute
  async getProgramsByInstitute(instituteName: string): Promise<Program[]> {
    const encodedName = encodeURIComponent(instituteName)
    const url = `${API_BASE_URL}/pathway/institutes/${encodedName}/programs`
    
    try {
      console.log(`📡 Fetching: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status}: ${errorText}`)
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }
      
      const json: ApiResponse<Program[]> = await response.json()
      console.log(`✅ Response:`, json)
      
      if (!json.success) {
        throw new Error(json.error || 'API returned unsuccessful response')
      }
      
      return json.data
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - is backend running?')
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Is it running?`)
      }
      throw error
    }
  },

  // Get program details
  async getProgramDetails(programName: string): Promise<Program> {
    const encodedName = encodeURIComponent(programName)
    const response = await fetch(`${API_BASE_URL}/pathway/programs/${encodedName}`)
    const json: ApiResponse<Program> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Get all careers
  async getCareers(): Promise<Career[]> {
    const response = await fetch(`${API_BASE_URL}/pathway/careers`)
    const json: ApiResponse<Career[]> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Get pathways to career
  async getPathwaysToCareer(careerTitle: string): Promise<Pathway[]> {
    const encodedTitle = encodeURIComponent(careerTitle)
    const response = await fetch(`${API_BASE_URL}/pathway/careers/${encodedTitle}/pathways`)
    const json: ApiResponse<Pathway[]> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Find career paths by qualifications
  async findCareerPaths(qualifications: string[]): Promise<Pathway[]> {
    const response = await fetch(`${API_BASE_URL}/pathway/career-paths`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qualifications })
    })
    const json: ApiResponse<Pathway[]> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Get complete pathway by department
  async getCompletePathway(departmentName: string): Promise<Program[]> {
    const encodedName = encodeURIComponent(departmentName)
    const response = await fetch(`${API_BASE_URL}/pathway/departments/${encodedName}/complete`)
    const json: ApiResponse<Program[]> = await response.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  },

  // Get pathway by qualification - NEW
  async getPathwayByQualification(departmentName: string, qualification: string): Promise<Program[]> {
    const encodedDept = encodeURIComponent(departmentName)
    const encodedQual = encodeURIComponent(qualification)
    const url = `${API_BASE_URL}/pathway/departments/${encodedDept}/by-qualification?qualification=${encodedQual}`
    
    try {
      console.log(`📡 Fetching pathway by qualification: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status}: ${errorText}`)
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }
      
      const json: ApiResponse<Program[]> = await response.json()
      console.log(`✅ Qualification-based response:`, json)
      
      if (!json.success) {
        throw new Error(json.error || 'API returned unsuccessful response')
      }
      
      return json.data
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - is backend running?')
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Is it running?`)
      }
      throw error
    }
  }
}
