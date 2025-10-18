import './App.css'
import { useState } from 'react'
import InterestSelection from './components/InterestSelection'
import QualificationSelection from './components/QualificationSelection'
import EducationRoadmap from './components/EducationRoadmap'
import LearningRoadmap from './components/LearningRoadmap'
import JobPortal from './components/JobPortal'
import { ReactFlowProvider } from '@xyflow/react'

type AppView = 'interest' | 'qualification' | 'roadmap' | 'learning-roadmap' | 'jobs'

function App() {
  const [currentView, setCurrentView] = useState<AppView>('interest')
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [selectedQualification, setSelectedQualification] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)

  const handleInterestSelect = (interest: string) => {
    setSelectedInterest(interest)
    setCurrentView('qualification')
  }

  const handleQualificationSelect = (qualification: string) => {
    setSelectedQualification(qualification)
    setCurrentView('roadmap')
  }

  const handleProgramSelect = (programName: string) => {
    setSelectedProgram(programName)
    setCurrentView('learning-roadmap')
  }

  const handleViewJobs = (pathway?: string) => {
    if (pathway) {
      setSelectedInterest(pathway)
    }
    setCurrentView('jobs')
  }

  const handleBackFromQualification = () => {
    setSelectedInterest(null)
    setSelectedQualification(null)
    setCurrentView('interest')
  }

  const handleBackFromRoadmap = () => {
    setSelectedQualification(null)
    setCurrentView('qualification')
  }

  const handleBackFromLearningRoadmap = () => {
    setSelectedProgram(null)
    setCurrentView('roadmap')
  }

  const handleBackFromJobs = () => {
    if (selectedQualification) {
      setCurrentView('roadmap')
    } else if (selectedInterest) {
      setCurrentView('qualification')
    } else {
      setCurrentView('interest')
    }
  }

  const handleViewLearningPathFromJobs = (pathway: string) => {
    setSelectedInterest(pathway)
    setCurrentView('qualification')
  }

  return (
    <div>
      {currentView === 'interest' && (
        <InterestSelection 
          onSelect={handleInterestSelect}
          onViewJobs={handleViewJobs}
        />
      )}
      
      {currentView === 'qualification' && selectedInterest && (
        <QualificationSelection 
          interest={selectedInterest}
          onSelect={handleQualificationSelect}
          onBack={handleBackFromQualification}
          onViewJobs={handleViewJobs}
        />
      )}
      
      {currentView === 'roadmap' && selectedInterest && selectedQualification && (
        <ReactFlowProvider>
          <EducationRoadmap 
            interest={selectedInterest}
            qualification={selectedQualification}
            onBack={handleBackFromRoadmap}
            onProgramSelect={handleProgramSelect}
            onViewJobs={handleViewJobs}
          />
        </ReactFlowProvider>
      )}

      {currentView === 'learning-roadmap' && selectedProgram && (
        <LearningRoadmap 
          programName={selectedProgram}
          onBack={handleBackFromLearningRoadmap}
          onViewJobs={handleViewJobs}
        />
      )}

      {currentView === 'jobs' && (
        <JobPortal 
          selectedPathway={selectedInterest || 'all'}
          onBack={handleBackFromJobs}
          onViewLearningPath={handleViewLearningPathFromJobs}
        />
      )}
    </div>
  )
}

export default App
