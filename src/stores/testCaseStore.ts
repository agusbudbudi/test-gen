import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/lib/idbStorage'

// ─── Test Run Types ───────────────────────────────────────────────────────────
export type RunItemStatus = 'UNTESTED' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED'

export interface ActivityLog {
  id: string
  action: 'CREATED' | 'STATUS_UPDATED' | 'NOTES_UPDATED'
  value?: string
  timestamp: string
}

export interface TestRunItem {
  id: string
  masterTcId: string   // ref ke TestCase.id di master (bukan tcId string)
  tcId: string
  title: string
  section: string
  caseType: string
  preconditions: string
  steps: string
  expectedResult: string
  status: RunItemStatus
  notes: string
  activityLogs: ActivityLog[]
}

export interface TestRun {
  id: string
  name: string
  description: string
  items: TestRunItem[]
  createdAt: string
  updatedAt: string
}

export interface TestCase {
  id: string
  tcId: string
  folderId: string
  section: string
  caseType: string
  title: string
  preconditions: string
  steps: string
  expectedResult: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  parentId: string | null
  name: string
  tag: string
  createdAt: string
}

interface TestManagementState {
  folders: Folder[]
  testCases: TestCase[]
  lastTcId: number
  selectedFolderId: string | null
  selectedFileId: string | null

  // Test Runs
  testRuns: TestRun[]
  selectedRunId: string | null
  
  // Actions
  addFolder: (name: string, tag: string, parentId: string | null) => void
  deleteFolder: (folderId: string) => void
  updateFolder: (folderId: string, updates: Partial<Folder>) => void
  
  addTestCase: (testCase: Omit<TestCase, 'id' | 'tcId' | 'createdAt' | 'updatedAt'>) => void
  deleteTestCase: (testCaseId: string) => void
  updateTestCase: (testCaseId: string, updates: Partial<TestCase>) => void
  
  setSelectedFolder: (folderId: string | null) => void
  setSelectedFile: (fileId: string | null) => void

  moveFolder: (folderId: string, newParentId: string | null) => void
  moveTestCase: (testCaseId: string, newFolderId: string | null) => void

  // Test Run actions
  addTestRun: (name: string, description: string, selectedTcIds: string[]) => void
  deleteTestRun: (runId: string) => void
  updateTestRun: (runId: string, updates: Partial<Pick<TestRun, 'name' | 'description'>>, selectedTcIds?: string[]) => void
  updateRunItem: (runId: string, itemId: string, updates: Partial<Pick<TestRunItem, 'status' | 'notes'>>) => void
  bulkUpdateRunItems: (runId: string, itemIds: string[], updates: Partial<Pick<TestRunItem, 'status' | 'notes'>>) => void
  setSelectedRunId: (runId: string | null) => void
}

export const useTestCaseStore = create<TestManagementState>()(
  persist(
    (set) => ({
      folders: [],
      testCases: [],
      lastTcId: 0,
      selectedFolderId: null,
      selectedFileId: null,
      testRuns: [],
      selectedRunId: null,

      addFolder: (name, tag, parentId) => {
        const newFolder: Folder = {
          id: crypto.randomUUID(),
          name,
          tag,
          parentId,
          createdAt: new Date().toISOString()
        }
        set((state) => ({ folders: [...state.folders, newFolder] }))
      },

      deleteFolder: (folderId) => {
        set((state) => {
          const getDescendantIds = (fid: string): string[] => {
            const subFolders = state.folders.filter(f => f.parentId === fid)
            return subFolders.flatMap(sf => [sf.id, ...getDescendantIds(sf.id)])
          }
          
          const folderIdsToDelete = [folderId, ...getDescendantIds(folderId)]
          
          return {
            folders: state.folders.filter(f => !folderIdsToDelete.includes(f.id)),
            testCases: state.testCases.filter(tc => !folderIdsToDelete.includes(tc.folderId)),
            selectedFolderId: folderIdsToDelete.includes(state.selectedFolderId || '') ? null : state.selectedFolderId
          }
        })
      },

      updateFolder: (folderId, updates) => {
        set((state) => ({
          folders: state.folders.map(f => f.id === folderId ? { ...f, ...updates } : f)
        }))
      },

      addTestCase: (testCaseData) => {
        set((state) => {
          let nextId = state.lastTcId + 1

          // Migration/Initialization: if lastTcId is 0 but we have test cases, 
          // find the max number in existing tcIds
          if (state.lastTcId === 0 && state.testCases.length > 0) {
            const maxId = state.testCases.reduce((max, tc) => {
              if (tc.tcId && tc.tcId.startsWith('TC-')) {
                const num = parseInt(tc.tcId.replace('TC-', ''), 10)
                return isNaN(num) ? max : Math.max(max, num)
              }
              return max
            }, 0)
            nextId = Math.max(state.testCases.length, maxId) + 1
          }

          const newTestCase: TestCase = {
            ...testCaseData,
            id: crypto.randomUUID(),
            tcId: `TC-${nextId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          return { 
            testCases: [...state.testCases, newTestCase],
            lastTcId: nextId
          }
        })
      },

      deleteTestCase: (testCaseId) => {
        set((state) => ({
          testCases: state.testCases.filter(tc => tc.id !== testCaseId),
          selectedFileId: state.selectedFileId === testCaseId ? null : state.selectedFileId
        }))
      },

      updateTestCase: (testCaseId, updates) => {
        set((state) => ({
          testCases: state.testCases.map(tc => 
            tc.id === testCaseId 
              ? { ...tc, ...updates, updatedAt: new Date().toISOString() } 
              : tc
          )
        }))
      },

      setSelectedFolder: (folderId) => set({ selectedFolderId: folderId, selectedFileId: null }),
      setSelectedFile: (fileId) => set({ selectedFileId: fileId }),

      moveFolder: (folderId, newParentId) => {
        set((state) => {
          // Cycle prevention: cannot move a folder into itself or its own descendants
          const isDescendantCheck = (destId: string | null, draggedId: string): boolean => {
            let currentId = destId
            while (currentId) {
              if (currentId === draggedId) return true
              const folder = state.folders.find(f => f.id === currentId)
              currentId = folder?.parentId || null
            }
            return false
          }

          if (folderId === newParentId || isDescendantCheck(newParentId, folderId)) {
            return state
          }

          return {
            folders: state.folders.map(f => 
              f.id === folderId ? { ...f, parentId: newParentId } : f
            )
          }
        })
      },

      moveTestCase: (testCaseId, newFolderId) => {
        set((state) => ({
          testCases: state.testCases.map(tc => 
            tc.id === testCaseId ? { ...tc, folderId: newFolderId as string, updatedAt: new Date().toISOString() } : tc
          )
        }))
      },

      // ─── Test Run Actions ─────────────────────────────────────────────────
      addTestRun: (name, description, selectedTcIds) => {
        set((state) => {
          const now = new Date().toISOString()
          const items: TestRunItem[] = selectedTcIds
            .map(tcId => state.testCases.find(tc => tc.id === tcId))
            .filter((tc): tc is TestCase => tc !== undefined)
            .map(tc => ({
              id: crypto.randomUUID(),
              masterTcId: tc.id,
              tcId: tc.tcId,
              title: tc.title,
              section: tc.section,
              caseType: tc.caseType,
              preconditions: tc.preconditions,
              steps: tc.steps,
              expectedResult: tc.expectedResult,
              status: 'UNTESTED' as RunItemStatus,
              notes: '',
              activityLogs: [{
                id: crypto.randomUUID(),
                action: 'CREATED',
                timestamp: now
              }]
            }))

          const newRun: TestRun = {
            id: crypto.randomUUID(),
            name,
            description,
            items,
            createdAt: now,
            updatedAt: now
          }

          return {
            testRuns: [...state.testRuns, newRun],
            selectedRunId: newRun.id
          }
        })
      },

      deleteTestRun: (runId) => {
        set((state) => ({
          testRuns: state.testRuns.filter(r => r.id !== runId),
          selectedRunId: state.selectedRunId === runId ? null : state.selectedRunId
        }))
      },

      updateTestRun: (runId, updates, selectedTcIds) => {
        set((state) => {
          const run = state.testRuns.find(r => r.id === runId)
          if (!run) return state

          let updatedItems = [...run.items]
          if (selectedTcIds) {
            // Remove items not in selectedTcIds
            updatedItems = updatedItems.filter(item => selectedTcIds.includes(item.masterTcId))

            // Add new items
            const currentMasterIds = new Set(updatedItems.map(item => item.masterTcId))
            const newTcIds = selectedTcIds.filter(id => !currentMasterIds.has(id))
            
            const newItems: TestRunItem[] = newTcIds
              .map(id => state.testCases.find(tc => tc.id === id))
              .filter((tc): tc is TestCase => tc !== undefined)
              .map(tc => ({
                id: crypto.randomUUID(),
                masterTcId: tc.id,
                tcId: tc.tcId,
                title: tc.title,
                section: tc.section,
                caseType: tc.caseType,
                preconditions: tc.preconditions,
                steps: tc.steps,
                expectedResult: tc.expectedResult,
                status: 'UNTESTED' as RunItemStatus,
                notes: '',
                activityLogs: [{
                  id: crypto.randomUUID(),
                  action: 'CREATED',
                  timestamp: new Date().toISOString()
                }]
              }))

            updatedItems = [...updatedItems, ...newItems]
          }

          return {
            testRuns: state.testRuns.map(r =>
              r.id === runId
                ? { ...r, ...updates, items: updatedItems, updatedAt: new Date().toISOString() }
                : r
            )
          }
        })
      },

      updateRunItem: (runId, itemId, updates) => {
        set((state) => ({
          testRuns: state.testRuns.map(r =>
            r.id === runId
              ? {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  items: r.items.map(item => {
                    if (item.id === itemId) {
                      const newLogs = [...(item.activityLogs || [])]
                      const now = new Date().toISOString()
                      
                      if (updates.status && updates.status !== item.status) {
                        newLogs.push({
                          id: crypto.randomUUID(),
                          action: 'STATUS_UPDATED',
                          value: updates.status,
                          timestamp: now
                        })
                      }
                      
                      if (updates.notes !== undefined && updates.notes !== item.notes) {
                        newLogs.push({
                          id: crypto.randomUUID(),
                          action: 'NOTES_UPDATED',
                          value: updates.notes,
                          timestamp: now
                        })
                      }

                      return { ...item, ...updates, activityLogs: newLogs }
                    }
                    return item
                  })
                }
              : r
          )
        }))
      },

      bulkUpdateRunItems: (runId, itemIds, updates) => {
        set((state) => ({
          testRuns: state.testRuns.map(r =>
            r.id === runId
              ? {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  items: r.items.map(item => {
                    if (itemIds.includes(item.id)) {
                      const newLogs = [...(item.activityLogs || [])]
                      const now = new Date().toISOString()

                      if (updates.status && updates.status !== item.status) {
                        newLogs.push({
                          id: crypto.randomUUID(),
                          action: 'STATUS_UPDATED',
                          value: updates.status,
                          timestamp: now
                        })
                      }

                      if (updates.notes !== undefined && updates.notes !== item.notes) {
                        newLogs.push({
                          id: crypto.randomUUID(),
                          action: 'NOTES_UPDATED',
                          value: updates.notes,
                          timestamp: now
                        })
                      }

                      return { ...item, ...updates, activityLogs: newLogs }
                    }
                    return item
                  })
                }
              : r
          )
        }))
      },

      setSelectedRunId: (runId) => set({ selectedRunId: runId })
    }),
    {
      name: 'test-management-storage',
      storage: createJSONStorage(() => idbStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate 'NOT RUN' to 'UNTESTED'
          if (persistedState.testRuns) {
            persistedState.testRuns = persistedState.testRuns.map((run: any) => ({
              ...run,
              items: run.items.map((item: any) => ({
                ...item,
                status: item.status === 'NOT RUN' ? 'UNTESTED' : item.status
              }))
            }))
          }
        }
        
        if (version < 2) {
          // Clean up orphaned test cases (where folder no longer exists)
          if (persistedState.testCases && persistedState.folders) {
            const folderIds = new Set(persistedState.folders.map((f: any) => f.id))
            persistedState.testCases = persistedState.testCases.filter((tc: any) => 
              !tc.folderId || folderIds.has(tc.folderId)
            )
          }
        }

        return persistedState
      }
    }
  )
)
