import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChat } from '@/lib/api'

export interface ReviewTestRow {
  Status: 'New' | 'Improved'
  No: string | number
  Section: string
  'Case Type': string
  Title: string
  Precondition: string
  Step: string
  'Expected Result': string
}

export interface ReviewResult {
  summary: string
  strengths: string[]
  suggestions: string[]
  missingCases: string[]
  improvedVersion?: ReviewTestRow[]
}

export function useReviewTestCase() {
  const [loading, setLoading] = useState(false)
  const reviewResult = useResultStore((state) => state.reviewResult)
  const setReviewResult = useResultStore((state) => state.setReviewResult)
  
  const { apiKey, selectedModel } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const review = useCallback(async (testCaseInput: string) => {
    if (!testCaseInput.trim()) {
      addToast('Please input a test case to review.', 'warning')
      return
    }

    if (!apiKey) {
      addToast('API Key is missing!', 'warning')
      return
    }

    setLoading(true)
    setReviewResult(null)

    try {
      const data = await fetchChat({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a senior QA expert. Analyze the provided test cases and provide a structured review in JSON format.
Include:
- summary: A brief overview of the test case quality.
- strengths: An array of key strengths.
- suggestions: An array of specific improvements.
- missingCases: An array of important scenarios not covered.
- improvedVersion: An array of objects containing ONLY the missing test cases or critically improved versions. Each object must have these keys: "Status", "No", "Section", "Case Type", "Title", "Precondition", "Step", "Expected Result". "Status" should be "New" or "Improved".

Respond ONLY with the JSON object.`
          },
          {
            role: 'user',
            content: `Please review the following test cases:\n\n${testCaseInput}`
          }
        ],
        ...(selectedModel.startsWith('o') ? {} : { temperature: 0.7 }),
        response_format: { type: "json_object" }
      }, apiKey)

      const reply = data.choices?.[0]?.message?.content || '{}'
      try {
        const parsedResult: ReviewResult = JSON.parse(reply)
        setReviewResult(parsedResult)

        // Add to history
        addHistory({
          type: 'review',
          content: {
            summary: parsedResult.summary,
            strengths: parsedResult.strengths,
            suggestions: parsedResult.suggestions,
            improvedVersion: JSON.stringify(parsedResult.improvedVersion) // Store as string in history for consistency
          }
        })
      } catch (parseErr) {
        throw new Error('Failed to parse AI response as JSON.')
      }
    } catch (error: any) {
      addToast(error.message || 'Failed to review test case', 'error')
    } finally {
      setLoading(false)
    }
  }, [apiKey, selectedModel, addToast, addHistory, setReviewResult])

  return { review, loading, reviewResult }
}
