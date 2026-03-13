import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { useUIStore } from '@/stores/uiStore'
import Layout from '@/components/Layout/Layout'
import ToastContainer from '@/components/Toast/ToastContainer'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'
import PromptInstructionsModal from '@/components/Modal/PromptInstructionsModal'
import HowToUseModal from '@/components/Modal/HowToUseModal'
import TemplateSelectionModal from '@/components/Modal/TemplateSelectionModal'

// Lazy load pages
const GeneratePage = lazy(() => import('@/pages/GenerateTestCase/GeneratePage'))
const ReviewPage   = lazy(() => import('@/pages/ReviewTestCase/ReviewPage'))
const BugReportPage = lazy(() => import('@/pages/BugReport/BugReportPage'))
const HistoryPage  = lazy(() => import('@/pages/History/HistoryPage'))
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage'))

const App = () => {
  const { 
    isPromptModalOpen, setPromptModalOpen,
    isHowToUseModalOpen, setHowToUseModalOpen,
    isTemplateModalOpen, setTemplateModalOpen,
    selectedTemplateId, setSelectedTemplateId,
    testCaseTemplates
  } = useUIStore()

  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])
  
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-surface dark:bg-surface-dark">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/generate" replace />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/bug-report" element={<BugReportPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/generate" replace />} />
            </Route>
          </Routes>
        </Suspense>
        
        <ToastContainer />
        
        {/* Global Modals */}
        <PromptInstructionsModal
          isOpen={isPromptModalOpen}
          onClose={() => setPromptModalOpen(false)}
        />
        <HowToUseModal
          isOpen={isHowToUseModalOpen}
          onClose={() => setHowToUseModalOpen(false)}
        />
        <TemplateSelectionModal
          isOpen={isTemplateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          selectedId={selectedTemplateId}
          onSelect={(id) => {
            setSelectedTemplateId(id)
            // We can also trigger the application logic here if needed, 
            // but the user said "click will apply template", 
            // which usually implies filling the form.
          }}
        />
      </Router>
    </ErrorBoundary>
  )
}

export default App
