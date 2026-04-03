import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChat } from '@/lib/api'

export function useGenerateTestCase() {
  const [loading, setLoading] = useState(false)
  const resultData = useResultStore((state) => state.generateResult)
  const setResultData = useResultStore((state) => state.setGenerateResult)
  
  const { apiKey, anthropicApiKey, aiProvider, promptInstructions, selectedModel, defaultTestCaseCount } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const generate = useCallback(async (userStory: string, promptDetails: string, options?: { count?: number, model?: string }) => {
    if (!userStory.trim() && !promptDetails.trim()) {
      addToast('Please enter User Story or details!', 'warning')
      return
    }

    if (!promptInstructions.trim()) {
      addToast('Please fill the Prompt Instructions first!', 'warning')
      return
    }

    const count = options?.count ?? defaultTestCaseCount
    const model = options?.model ?? selectedModel

    const activeApiKey = aiProvider === 'anthropic' ? anthropicApiKey : apiKey
    if (!activeApiKey) {
      addToast('API Key is missing! Please set it in the sidebar.', 'warning')
      return
    }

    setLoading(true)
    setResultData(null)

    const combinedPrompt = `You are a professional QA engineer. Generate minimum ${count} and maximum as many as possible comprehensive test cases based on the provided requirements.

### OUTPUT RULES:
1. **Format**: You MUST return a valid JSON array of objects.
2. **Schema**: Each object must have these exactly these keys: "No", "Section", "Case Type", "Title", "Precondition", "Step", "Expected Result".
3. **Content Formatting (STRICT)**: 
   - Apply all "Global Instructions" (Gherkin syntax, list styles, etc.) strictly to the text *inside* the JSON fields.
   - Use \`<br>\` for ALL line breaks within the strings. Do NOT use literal newlines (\\n).
   - Ensure "Precondition", "Step", and "Expected Result" follow Gherkin syntax (Given/When/Then/And) if requested.

### INPUT DATA:
${userStory ? `**User Story / Requirements**:\n${userStory}\n` : ''}
${promptDetails ? `**Prompt Details / Context**:\n${promptDetails}\n` : ''}

### GLOBAL INSTRUCTIONS (PRIORITY):
${promptInstructions}

**Only output the raw JSON array.**`

    try {
      const data = await fetchChat({
        model: model,
        provider: aiProvider,
        messages: [{ role: 'user', content: combinedPrompt }],
        ...(model.startsWith('o') ? {} : { temperature: 0.1 }),
      }, activeApiKey)

      const resultText = data.choices?.[0]?.message?.content || ''
      const jsonString = resultText.replace(/```json\n?|```/g, '').trim()
      const parsedJson = JSON.parse(jsonString)

      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        const headers = ["No", "Section", "Case Type", "Title", "Precondition", "Step", "Expected Result"]
        const rows = parsedJson.map((item: any) => [
          item["No"] || '',
          item["Section"] || '',
          item["Case Type"] || '',
          item["Title"] || '',
          item["Precondition"] || '',
          item["Step"] || '',
          item["Expected Result"] || ''
        ])
        
        setResultData([headers, ...rows])
        
        // Auto add prompt to history
        addHistory({
          type: 'prompt',
          content: `**User Story**:\n${userStory}\n\n**Details**:\n${promptDetails}`
        })
      } else {
        addToast('No test cases generated or invalid format.', 'warning')
      }
    } catch (error: any) {
      console.error('Test case generation failed:', error)
      addToast(error.message || 'Failed to generate test cases', 'error')
    } finally {
      setLoading(false)
    }
  }, [apiKey, anthropicApiKey, aiProvider, promptInstructions, selectedModel, defaultTestCaseCount, addHistory, addToast, setResultData])

  return { generate, loading, resultData, setResultData }
}
