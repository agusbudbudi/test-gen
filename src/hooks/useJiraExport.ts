import { useCallback, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'

export interface JiraExportProgress {
  done: number
  total: number
}

export function useJiraExport() {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<JiraExportProgress>({ done: 0, total: 0 })

  const { jiraUrl, jiraEmail, jiraToken, jiraProjectKey } = useUIStore()
  const addToast = useToastStore((state) => state.addToast)

  /**
   * Strip HTML tags from a cell that may contain formatted HTML
   * and convert <br> to newlines, <strong> to its text content.
   */
  const htmlToPlainText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim()
  }

  // Helper to extract Jira key from URL
  const extractJiraKey = (url: string): string | null => {
    if (!url) return null
    // Matches /browse/PROJECT-123 or directly PROJECT-123
    const match = url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/i) || url.match(/^([A-Z0-9]+-[0-9]+)$/i)
    return match ? match[1].toUpperCase() : null
  }

  /**
   * bugData is the full 2D array: first row = headers, rest = data rows
   */
    const exportToJira = useCallback(async (
    bugData: string[][], 
    linkConfig?: { jiraUrl?: string; linkType?: string; issueType?: string }
  ) => {
    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraProjectKey) {
      addToast('Please configure Jira settings first (Settings → Jira Integration).', 'warning')
      return
    }

    if (!bugData || bugData.length <= 1) {
      addToast('No bug report data to export.', 'warning')
      return
    }

    setExporting(true)
    setProgress({ done: 0, total: 1 })

    const headers = bugData[0]
    const rows = bugData.slice(1)

    // Helper to build an ADF cell (Header or Body)
    const buildAdfCell = (text: string, isHeader: boolean = false) => {
      return {
        type: isHeader ? "tableHeader" : "tableCell",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: htmlToPlainText(text) || " " }]
          }
        ]
      }
    }

    // Build ADF table rows
    const adfRows = [
      // Header row
      {
        type: "tableRow",
        content: headers.map(h => buildAdfCell(h, true))
      },
      // Data rows
      ...rows.map(row => ({
        type: "tableRow",
        content: row.map(cell => buildAdfCell(cell))
      }))
    ]

    // Final ADF Document structure
    const adfDocument = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "table",
          attrs: { isNumberColumnEnabled: false, layout: "default" },
          content: adfRows
        }
      ]
    }

    const firstBugSummary = htmlToPlainText(rows[0][0]).substring(0, 200)
    const summary = `${firstBugSummary}${rows.length > 1 ? ` (+${rows.length - 1} more)` : ''}`

    // Handle Issue Linking
    let linkedIssueKey = null
    if (linkConfig?.jiraUrl) {
      linkedIssueKey = extractJiraKey(linkConfig.jiraUrl)
      if (!linkedIssueKey) {
        addToast('Invalid Jira URL/Key provided for linking. Exporting without link.', 'warning')
      }
    }

    try {
      const res = await fetch('/api/jira/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraUrl: jiraUrl.trim().replace(/\/$/, ''),
          email: jiraEmail.trim(),
          token: jiraToken.trim(),
          projectKey: jiraProjectKey.trim(),
          summary,
          description: adfDocument,
          linkedIssueKey,
          linkType: linkConfig?.linkType,
          issueType: linkConfig?.issueType,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = errData?.details?.errors
          ? Object.values(errData.details.errors).join(', ')
          : errData?.error || `HTTP ${res.status}`
        addToast(`Failed to export to Jira: ${msg}`, 'error')
        return null
      } else {
        const data = await res.json()
        addToast(`✅ Bug report exported successfully to Jira: ${data.key}`, 'success')
        return data // { key, url }
      }
    } catch (err: any) {
      addToast(`Network error: ${err.message}`, 'error')
      return null
    } finally {
      setProgress({ done: 1, total: 1 })
      setExporting(false)
    }
  }, [jiraUrl, jiraEmail, jiraToken, jiraProjectKey, addToast])

  return { exportToJira, exporting, progress }
}
