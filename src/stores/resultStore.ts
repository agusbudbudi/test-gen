import { create } from 'zustand'
import { ReviewResult } from '@/hooks/useReviewTestCase'

interface ResultState {
  // Generate Test Case Results
  generateResult: string[][] | null
  setGenerateResult: (result: string[][] | null) => void

  // Review Test Case Results
  reviewResult: ReviewResult | null
  setReviewResult: (result: ReviewResult | null) => void

  // Bug Report Results
  bugResult: string[][] | null
  setBugResult: (result: string[][] | null) => void

  // Pending Review Transfer
  pendingReviewInput: string | null
  setPendingReviewInput: (input: string | null) => void

  // Helper to clear all results (if needed)
  clearAllResults: () => void
}

export const useResultStore = create<ResultState>((set) => ({
  // Generate Test Case Results
  generateResult: null,
  setGenerateResult: (result) => set({ generateResult: result }),

  // Review Test Case Results
  reviewResult: null,
  setReviewResult: (result) => set({ reviewResult: result }),

  // Bug Report Results
  bugResult: null,
  setBugResult: (result) => set({ bugResult: result }),

  // Pending Review Transfer
  pendingReviewInput: null,
  setPendingReviewInput: (input) => set({ pendingReviewInput: input }),

  // Helper to clear all results
  clearAllResults: () => set({ generateResult: null, reviewResult: null, bugResult: null, pendingReviewInput: null }),
}))
