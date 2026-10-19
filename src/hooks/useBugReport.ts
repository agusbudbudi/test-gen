import { useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'
import { useResultStore } from '@/stores/resultStore'
import { fetchChat, VisionContentPart } from '@/lib/api'
import { formatDescription } from '@/lib/formatContent'
import { getActiveApiKey, hasUsableApiKey } from '@/lib/aiProvider'

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

export type BugReportMode = 'simple' | 'detail'

// Field order for the detailed (Field | Detail) report.
const DETAIL_FIELDS = [
  'Title',
  'Severity',
  'Priority',
  'Environment',
  'Steps to Reproduce',
  'Expected Result',
  'Actual Result',
  'Data Test',
  'Assessment & Root Cause Analysis (AI)',
  'Retest Result',
] as const

// Fields rendered as numbered steps instead of bullets.
const NUMBERED_FIELDS = new Set(['Steps to Reproduce'])

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const formatDetailValue = (field: string, value: unknown): string => {
  const items = Array.isArray(value)
    ? value.map((v) => String(v ?? '').trim()).filter(Boolean)
    : [String(value ?? '').trim()].filter(Boolean)
  if (items.length === 0) return 'NA'

  const text = items.length === 1 && !NUMBERED_FIELDS.has(field)
    ? items[0]
    : items
        .map((item, i) => (NUMBERED_FIELDS.has(field) ? `${i + 1}. ${item}` : `• ${item}`))
        .join('\n')

  return escapeHtml(text.replace(/\*\*(.+?)\*\*/g, '$1')).replace(/`([^`\n]+)`/g, '<code>$1</code>')
}

const buildSimplePrompt = (bugDetails: string) => `You are a QA specialist. Based on the following bug details (which may include images), generate a structured **bug report** in valid JSON format.
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

const buildDetailPrompt = (bugDetails: string) => `You are a senior QA engineer writing a detailed, evidence-based bug report for developers. Analyze the bug details (and any attached screenshots) deeply: identify the affected component and layer (FE/BE/API/content/config), compare against expected behaviour or requirements mentioned, look for comparable working behaviour, separate observed facts from hypotheses, and reason about the probable root cause, business/user impact, and a concrete fix direction.

Return a single JSON object with exactly these keys:
${DETAIL_FIELDS.map((f) => `"${f}"`).join(', ')}

Value rules:
- Every value is either a string or an array of strings. Use an array whenever the field has several points (each item becomes one bullet).
- "Title": format "[Bug][<Layer e.g. FE/BE/API>][<Feature/Module>] <concise description of the defect>" and append a requirement/test reference in parentheses if one is given.
- "Severity" and "Priority": one of Critical, High, Medium, Low.
- "Environment": array — URL/environment name, build/version, browser/device/viewport, date, data source. Only what is known from the input.
- "Steps to Reproduce": array of precise, numbered-ready steps (no leading numbers).
- "Expected Result": what should happen, citing the requirement/PRD/spec and its link if provided.
- "Actual Result": what actually happens, including scope (which devices/viewports/environments) and a contrast with similar working behaviour if visible.
- "Data Test": accounts/test data used, or "NA".
- "Assessment & Root Cause Analysis (AI)": array with items starting "Probable cause: ...", "Impact: ...", "Suggested fix: ...".
- "Retest Result": always "Pending".
- Keep each item to one or two sentences and each array to at most 6 items. Be specific, not verbose.
- Wrap code identifiers, URL paths, selectors, params and values in backticks. Do not use any other Markdown (no bold, no headings).
- Never invent facts (IDs, URLs, build numbers, dates, test names, run dates). If something is unknown, write "NA" or "Needs confirmation: <what to confirm>". Mark inferences as probable.
- Write in the same language as the bug details.

**Output only the raw JSON object.**

Bug Details:
${bugDetails}`

export function useBugReport() {
  const [loading, setLoading] = useState(false)
  const bugData = useResultStore((state) => state.bugResult)
  const setBugData = useResultStore((state) => state.setBugResult)
  
  const { apiKey, anthropicApiKey, aiProvider, selectedModel } = useUIStore()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addToast = useToastStore((state) => state.addToast)

  const generateReport = useCallback(async (bugDetails: string, images?: File[], mode: BugReportMode = 'simple') => {
    if (!bugDetails.trim() && (!images || images.length === 0)) {
      addToast('Please enter bug details or upload an image!', 'warning')
      return
    }

    const activeApiKey = getActiveApiKey(aiProvider, apiKey, anthropicApiKey)
    if (!hasUsableApiKey(aiProvider, apiKey, anthropicApiKey)) {
      addToast('API Key is missing!', 'warning')
      return
    }

    setLoading(true)
    setBugData(null)

    const basePrompt = mode === 'detail' ? buildDetailPrompt(bugDetails) : buildSimplePrompt(bugDetails)

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
        // Anthropic vision format (also passed through by the Claude subscription backend)
        else if (aiProvider === 'anthropic' || aiProvider === 'claude-subscription') {
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

      let rows: string[][] = []
      let headers: string[] = []
      if (mode === 'detail') {
        const report = Array.isArray(parsedJson) ? parsedJson[0] : parsedJson
        const knownFields = report && typeof report === 'object'
          ? DETAIL_FIELDS.filter((field) => report[field] !== undefined).length
          : 0
        // Require most fields so a mis-keyed response isn't shown as an all-"NA" report.
        if (knownFields >= Math.ceil(DETAIL_FIELDS.length / 2)) {
          headers = ['Field', 'Detail']
          rows = DETAIL_FIELDS.map((field) => [field, formatDetailValue(field, report[field])])
        }
      } else if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        headers = ["Summary", "Description", "Severity & Retest Result"]
        rows = parsedJson.map((item: any) => [
          item.Summary || '',
          formatDescription(item.Description || ''),
          item["Severity & Retest Result"] || ''
        ])
      }

      if (rows.length > 0) {
        setBugData([headers, ...rows])
        addToast('Bug report generated successfully!', 'success')

        addHistory({
          type: 'prompt',
          content: `**Bug Details** (${mode}):\n${bugDetails}${images?.length ? `\n\n*Included ${images.length} image(s)*` : ''}`
        })
        addHistory({
          type: 'bug_result',
          headers,
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
