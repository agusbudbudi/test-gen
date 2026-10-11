import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/lib/idbStorage'

export type HistoryEntryType = 'prompt' | 'result' | 'review' | 'bug_result'

export interface HistoryEntry {
  type: HistoryEntryType
  content: string | string[][] | {
    summary: string
    strengths: string[]
    suggestions: string[]
    improvedVersion?: string
  }
  // Table header row for 'bug_result' entries (rows are stored without it).
  headers?: string[]
  createdAt: string
}

interface HistoryState {
  historyEntries: HistoryEntry[]
  addEntry: (entry: Omit<HistoryEntry, 'createdAt'>) => void
  deleteEntry: (index: number) => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      historyEntries: [],
      addEntry: (entry) => set((state) => ({
        historyEntries: [
          ...state.historyEntries,
          { ...entry, createdAt: new Date().toISOString() }
        ]
      })),
      deleteEntry: (index) => set((state) => ({
        historyEntries: state.historyEntries.filter((_, i) => i !== index)
      })),
      clearHistory: () => set({ historyEntries: [] }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
