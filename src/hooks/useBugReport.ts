import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChat } from '@/lib/api'
import { formatDescription } from '@/lib/formatContent'

import { useHistoryStore } from '@/stores/historyStore'

export function useBugReport() {
  const [loading, setLoading] = useState(false)
  const bugData = useResultStore((state) => state.bugResult)
  const setBugData = useResultStore((state) => state.setBugResult)
  
  const { apiKey, selectedModel } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const generateReport = useCallback(async (bugDetails: string) => {
    if (!bugDetails.trim()) {
      addToast('Please enter bug details!', 'warning')
      return
    }

    if (!apiKey) {
      addToast('API Key is missing!', 'warning')
      return
    }

    setLoading(true)
    setBugData(null)

    const prompt = `You are a QA specialist. Based on the following bug details, generate a structured **bug report** in valid JSON format.
The JSON should be an array of objects, where each object has exactly these keys: "Summary", "Description", "Severity & Retest Result".

**Instructions for each field:**
- **Summary**: A concise yet comprehensive title. Format: "[Component or Feature] - [Brief description of issue]".
- **Description**: Use the format below for the content:
  **Preconditions:**
  ...
  **Test Data:**
  ...
  **Steps to Reproduce:**
  1. Step one
  ...
  **Actual Result:**
  ...
  **Expected Result:**
  ...
- **Severity & Retest Result**: Level (Minor/Major/Critical) and status.

**Output only the raw JSON array.**

Bug Details:
${bugDetails}`

    try {
      const data = await fetchChat({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        ...(selectedModel.startsWith('o') ? {} : { temperature: 0.1 }), // Lower temperature for more consistent JSON
      }, apiKey)

      const resultText = data.choices?.[0]?.message?.content || ''
      
      // Clean up potential markdown blocks if AI wraps JSON
      const jsonString = resultText.replace(/```json\n?|```/g, '').trim()
      const parsedJson = JSON.parse(jsonString)

      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        const headers = ["Summary", "Description", "Severity & Retest Result"]
        const rows = parsedJson.map((item: any) => [
          item.Summary || '',
          formatDescription(item.Description || ''),
          item["Severity & Retest Result"] || ''
        ])
        
        setBugData([headers, ...rows])
        addToast('Bug report generated successfully!', 'success')

        // Add to history
        addHistory({
          type: 'prompt',
          content: `**Bug Details**:\n${bugDetails}`
        })
        addHistory({
          type: 'bug_result',
          content: rows
        })
      } else {
        addToast('No bug report generated or invalid format.', 'warning')
      }
    } catch (error: any) {
      console.error('Bug report generation failed:', error)
      addToast(error.message || 'Failed to generate bug report', 'error')
    } finally {
      setLoading(false)
    }
  }, [apiKey, addToast, addHistory, setBugData, selectedModel])

  return { generateReport, loading, bugData }
}
