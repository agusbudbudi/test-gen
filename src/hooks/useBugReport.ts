import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChat, VisionContentPart } from '@/lib/api'
import { formatDescription } from '@/lib/formatContent'

import { useHistoryStore } from '@/stores/historyStore'

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function useBugReport() {
  const [loading, setLoading] = useState(false)
  const bugData = useResultStore((state) => state.bugResult)
  const setBugData = useResultStore((state) => state.setBugResult)
  
  const { apiKey, anthropicApiKey, aiProvider, selectedModel } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const generateReport = useCallback(async (bugDetails: string, images?: File[]) => {
    if (!bugDetails.trim() && (!images || images.length === 0)) {
      addToast('Please enter bug details or upload an image!', 'warning')
      return
    }

    const activeApiKey = aiProvider === 'anthropic' ? anthropicApiKey : apiKey
    if (!activeApiKey) {
      addToast('API Key is missing!', 'warning')
      return
    }

    setLoading(true)
    setBugData(null)

    const basePrompt = `You are a QA specialist. Based on the following bug details (which may include images), generate a structured **bug report** in valid JSON format.
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
      let content: string | VisionContentPart[] = basePrompt;

      // Handle vision if images are provided
      if (images && images.length > 0) {
        const visionParts: VisionContentPart[] = [];

        // OpenAI vision format
        if (aiProvider === 'openai') {
          visionParts.push({ type: 'text', text: basePrompt });
          for (const img of images) {
            const base64 = await fileToBase64(img);
            visionParts.push({
              type: 'image_url',
              image_url: { url: base64 }
            });
          }
          content = visionParts;
        } 
        // Anthropic vision format
        else if (aiProvider === 'anthropic') {
          for (const img of images) {
            const base64Full = await fileToBase64(img);
            // Anthropic expects base64 without prefix
            const [header, base64] = base64Full.split(',');
            const mediaType = header.split(':')[1].split(';')[0];
            
            visionParts.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64
              }
            });
          }
          visionParts.push({ type: 'text', text: basePrompt });
          content = visionParts;
        }
      }

      const data = await fetchChat({
        model: selectedModel,
        messages: [{ role: 'user', content }],
        ...(selectedModel.startsWith('o') ? {} : { temperature: 0.1 }),
        provider: aiProvider
      }, activeApiKey)

      const resultText = data.choices?.[0]?.message?.content || ''
      
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

        addHistory({
          type: 'prompt',
          content: `**Bug Details**:\n${bugDetails}${images?.length ? `\n\n*Included ${images.length} image(s)*` : ''}`
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
  }, [apiKey, anthropicApiKey, aiProvider, addToast, addHistory, setBugData, selectedModel])

  return { generateReport, loading, bugData }
}
