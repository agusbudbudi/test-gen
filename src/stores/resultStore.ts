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

  // Product Knowledge Results
  productKnowledgeResult: string | null
  setProductKnowledgeResult: (result: string | null) => void
  productKnowledgeUrls: string[]
  setProductKnowledgeUrls: (urls: string[]) => void

  // AC Analyzer Results
  acAnalyzerResult: string | null
  setAcAnalyzerResult: (result: string | null) => void
  acAnalyzerUrl: string
  setAcAnalyzerUrl: (url: string) => void
  acAnalyzerContext: string
  setAcAnalyzerContext: (context: string) => void

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

  // Product Knowledge Results
  productKnowledgeResult: null,
  setProductKnowledgeResult: (result) => set({ productKnowledgeResult: result }),
  productKnowledgeUrls: [''],
  setProductKnowledgeUrls: (urls) => set({ productKnowledgeUrls: urls }),

  // AC Analyzer Results
  acAnalyzerResult: null,
  setAcAnalyzerResult: (result) => set({ acAnalyzerResult: result }),
  acAnalyzerUrl: '',
  setAcAnalyzerUrl: (url) => set({ acAnalyzerUrl: url }),
  acAnalyzerContext: '',
  setAcAnalyzerContext: (context) => set({ acAnalyzerContext: context }),

  // Pending Review Transfer
  pendingReviewInput: null,
  setPendingReviewInput: (input) => set({ pendingReviewInput: input }),

  // Helper to clear all results
  clearAllResults: () => set({ 
    generateResult: null, 
    reviewResult: null, 
    bugResult: null, 
    productKnowledgeResult: null,
    productKnowledgeUrls: [''],
    acAnalyzerResult: null,
    acAnalyzerUrl: '',
    acAnalyzerContext: '',
    pendingReviewInput: null 
  }),
}))
