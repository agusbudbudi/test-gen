import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/lib/idbStorage'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  promptInstructions: string
  setPromptInstructions: (instructions: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  defaultTestCaseCount: number
  setDefaultTestCaseCount: (count: number) => void
  testCaseTemplates: { id: string; name: string; prompt: string }[]
  setTestCaseTemplates: (templates: { id: string; name: string; prompt: string }[]) => void
  // Jira Integration
  jiraUrl: string
  setJiraUrl: (url: string) => void
  jiraEmail: string
  setJiraEmail: (email: string) => void
  jiraToken: string
  setJiraToken: (token: string) => void
  jiraProjectKey: string
  setJiraProjectKey: (key: string) => void
  // Confluence Integration
  confluenceUrl: string
  setConfluenceUrl: (url: string) => void
  confluenceEmail: string
  setConfluenceEmail: (email: string) => void
  confluenceToken: string
  setConfluenceToken: (token: string) => void
  confluenceSpaceKey: string
  setConfluenceSpaceKey: (key: string) => void
  confluenceParentPageId: string
  setConfluenceParentPageId: (id: string) => void
  // Modals
  isPromptModalOpen: boolean
  setPromptModalOpen: (open: boolean) => void
  isHowToUseModalOpen: boolean
  setHowToUseModalOpen: (open: boolean) => void
  isTemplateModalOpen: boolean
  setTemplateModalOpen: (open: boolean) => void
  selectedTemplateId: string
  setSelectedTemplateId: (id: string) => void
  // Mobile Nav
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      promptInstructions: '',
      setPromptInstructions: (instructions) => set({ promptInstructions: instructions }),
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: '' }),
      selectedModel: 'gpt-4o-mini',
      setSelectedModel: (model) => set({ selectedModel: model }),
      defaultTestCaseCount: 5,
      setDefaultTestCaseCount: (count) => set({ defaultTestCaseCount: count }),
      testCaseTemplates: [
        { id: 'web', name: 'Web Application', prompt: 'Focus on UI interactions, browser compatibility, and responsive design.' },
        { id: 'mobile', name: 'Mobile App', prompt: 'Focus on touch gestures, screen orientations, and mobile connectivity.' },
        { id: 'api', name: 'REST API', prompt: 'Focus on status codes, payload validation, and authentication.' },
        { id: 'edge', name: 'Edge Cases', prompt: 'Focus on boundary values, null inputs, and unexpected user behavior.' }
      ],
      setTestCaseTemplates: (templates) => set({ testCaseTemplates: templates }),
      // Jira Integration
      jiraUrl: '',
      setJiraUrl: (url) => set({ jiraUrl: url }),
      jiraEmail: '',
      setJiraEmail: (email) => set({ jiraEmail: email }),
      jiraToken: '',
      setJiraToken: (token) => set({ jiraToken: token }),
      jiraProjectKey: '',
      setJiraProjectKey: (key) => set({ jiraProjectKey: key }),
      // Confluence Integration
      confluenceUrl: '',
      setConfluenceUrl: (url) => set({ confluenceUrl: url }),
      confluenceEmail: '',
      setConfluenceEmail: (email) => set({ confluenceEmail: email }),
      confluenceToken: '',
      setConfluenceToken: (token) => set({ confluenceToken: token }),
      confluenceSpaceKey: '',
      setConfluenceSpaceKey: (key) => set({ confluenceSpaceKey: key }),
      confluenceParentPageId: '',
      setConfluenceParentPageId: (id) => set({ confluenceParentPageId: id }),
      // Modals
      isPromptModalOpen: false,
      setPromptModalOpen: (open) => set({ isPromptModalOpen: open }),
      isHowToUseModalOpen: false,
      setHowToUseModalOpen: (open) => set({ isHowToUseModalOpen: open }),
      isTemplateModalOpen: false,
      setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),
      selectedTemplateId: 'web',
      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
      // Mobile Nav
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        promptInstructions: state.promptInstructions,
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        defaultTestCaseCount: state.defaultTestCaseCount,
        testCaseTemplates: state.testCaseTemplates,
        selectedTemplateId: state.selectedTemplateId,
        jiraUrl: state.jiraUrl,
        jiraEmail: state.jiraEmail,
        jiraToken: state.jiraToken,
        jiraProjectKey: state.jiraProjectKey,
        confluenceUrl: state.confluenceUrl,
        confluenceEmail: state.confluenceEmail,
        confluenceToken: state.confluenceToken,
        confluenceSpaceKey: state.confluenceSpaceKey,
        confluenceParentPageId: state.confluenceParentPageId,
      }),
    }
  )
)
