import { useState, useCallback, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChatStream } from '@/lib/api'

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

const extractSection = (text: string, tag: string) => {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)(?:<\\/${tag}>|$)`, 'i')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

const extractList = (text: string) => 
  text.split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(line => line.length > 0)

const parseTable = (tableText: string): ReviewTestRow[] => {
  if (!tableText) return []
  const lines = tableText.trim().split('\n')
  const rows: ReviewTestRow[] = []
  
  // Skip header (idx 0) and separator (idx 1). Wait, sometimes Markdown tables start immediately, sometimes they have empty lines before. 
  // We just look for lines containing '|' and aren't purely separators (like `|---|`)
  let dataStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('|') && lines[i].includes('---')) {
      dataStartIndex = i + 1
      break
    }
  }

  if (dataStartIndex === -1) return []

  for (let i = dataStartIndex; i < lines.length; i++) {
    if (!lines[i].includes('|')) continue
    const cols = lines[i].split('|').map(s => s.trim())
    // cols might have empty first/last elements because of leading/trailing '|'
    if (cols.length >= 9) {
      // cols[0] is usually empty string before the first '|'
      rows.push({
        Status: (cols[1] || '') as any,
        No: cols[2] || '',
        Section: cols[3] || '',
        'Case Type': cols[4] || '',
        Title: cols[5] || '',
        Precondition: cols[6] || '',
        Step: cols[7] || '',
        'Expected Result': cols[8] || '',
      })
    }
  }
  return rows
}

const parseStreamingReviewResult = (streamText: string): ReviewResult => {
  return {
    summary: extractSection(streamText, 'SUMMARY'),
    strengths: extractList(extractSection(streamText, 'STRENGTHS')),
    suggestions: extractList(extractSection(streamText, 'SUGGESTIONS')),
    missingCases: extractList(extractSection(streamText, 'MISSING_CASES')),
    improvedVersion: parseTable(extractSection(streamText, 'IMPROVED_VERSION'))
  }
}

export function useReviewTestCase() {
  const [loading, setLoading] = useState(false)
  const reviewResult = useResultStore((state) => state.reviewResult)
  const setReviewResult = useResultStore((state) => state.setReviewResult)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])
  
  const { apiKey, anthropicApiKey, aiProvider, selectedModel } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const review = useCallback(async (testCaseInput: string): Promise<boolean> => {
    if (!testCaseInput.trim()) {
      addToast('Please input a test case to review.', 'warning')
      return false
    }

    const activeApiKey = aiProvider === 'anthropic' ? anthropicApiKey : apiKey
    if (!activeApiKey) {
      // Don't toast here if we might be waiting for hydration, 
      // or at least return false so the caller knows it didn't start.
      return false
    }

    setLoading(true)
    setReviewResult(null)

    cancel()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const currentSignal = controller.signal

    try {
      const systemContent = `You are a senior QA expert. Analyze the provided test cases and provide a structured review using XML-like tags.
You MUST output EXACTLY using the following format:

<SUMMARY>
A brief overview of the test case quality.
</SUMMARY>
<STRENGTHS>
- First key strength
- Second key strength
</STRENGTHS>
<SUGGESTIONS>
- Specific improvement suggestion
</SUGGESTIONS>
<MISSING_CASES>
- Important scenario not covered
</MISSING_CASES>
<IMPROVED_VERSION>
| Status | No | Section | Case Type | Title | Precondition | Step | Expected Result |
|---|---|---|---|---|---|---|---|
| New or Improved | 1 | ... | ... | ... | - Precon 1<br>- Precon 2 | 1. Step 1<br>2. Step 2 | - Expected 1<br>- Expected 2 |
</IMPROVED_VERSION>

### TABLE FORMATTING RULES (CRITICAL):
- You MUST use \`<br>\` for ALL newlines within table cells. Do NOT use literal newlines inside a cell, as it will break the table format.
- Precondition: Use dash (\`- \`) and separate multiple preconditions with \`<br>\`.
- Step: Use numbers (\`1. \`, \`2. \`) and separate multiple steps with \`<br>\`.
- Expected Result: Use dash (\`- \`) and separate multiple results with \`<br>\`.
- The IMPROVED_VERSION table should contain ONLY the missing test cases or critically improved versions. Exactly match the columns above.`

      let fullResult = ''

      await fetchChatStream({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: `Please review the following test cases:\n\n${testCaseInput}` }
        ],
        ...(selectedModel.startsWith('o') ? {} : { temperature: 0.7 }),
        stream: true,
        provider: aiProvider
      }, activeApiKey, (chunk) => {
        fullResult += chunk
        // Parse and progressively update UI
        const parsedState = parseStreamingReviewResult(fullResult)
        
        // Prevent assigning full empty arrays at the very start where we want it to be null
        // However, if the partial parses correctly, we update the object
        setReviewResult(parsedState)
      }, { signal: currentSignal })

      // Final parse check and save to history
      const finalResult = parseStreamingReviewResult(fullResult)
      setReviewResult(finalResult)

      addHistory({
        type: 'review',
        content: {
          summary: finalResult.summary,
          strengths: finalResult.strengths,
          suggestions: finalResult.suggestions,
          improvedVersion: JSON.stringify(finalResult.improvedVersion)
        }
      })
      
      addToast('Test case review completed!', 'success')
      return true
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addToast('Review cancelled. Keeping partial results.', 'info')
        return true // Technically started and was cancelled
      }
      console.error('Review failed:', error)
      addToast(error.message || 'Failed to review test case', 'error')
      return false
    } finally {
      if (abortControllerRef.current?.signal === currentSignal) {
        setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [apiKey, anthropicApiKey, aiProvider, selectedModel, addToast, addHistory, setReviewResult, cancel])

  return { review, cancel, loading, reviewResult }
}
