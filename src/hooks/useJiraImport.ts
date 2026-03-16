import { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'

export function useJiraImport() {
  const [importing, setImporting] = useState(false)
  const { jiraUrl, jiraEmail, jiraToken } = useUIStore()
  const addToast = useToastStore((state) => state.addToast)

  // Helper to extract Jira key from URL
  const extractJiraKey = (url: string): string | null => {
    if (!url) return null
    const match = url.match(/\/browse\/([A-Z0-9]+-[0-9]+)/i) || url.match(/^([A-Z0-9]+-[0-9]+)$/i)
    return match ? match[1].toUpperCase() : null
  }

  const importFromJira = async (url: string) => {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      addToast('Please configure Jira settings first (Settings → Jira Integration).', 'warning')
      return null
    }

    const key = extractJiraKey(url)
    if (!key) {
      addToast('Invalid Jira URL provided.', 'error')
      return null
    }

    setImporting(true)

    try {
      const res = await fetch(`/api/jira/issue/${key}?jiraUrl=${encodeURIComponent(jiraUrl)}&email=${encodeURIComponent(jiraEmail)}&token=${encodeURIComponent(jiraToken)}`)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = errData?.details?.errorMessages
          ? errData.details.errorMessages.join(', ')
          : errData?.error || `HTTP ${res.status}`
        addToast(`Failed to import from Jira: ${msg}`, 'error')
        return null
      } else {
        const data = await res.json()
        const summary = data.fields?.summary || ''
        
        // Jira sometimes uses ADF for descriptions, and sometimes plain text or HTML.
        let description = ''
        const descField = data.fields?.description
        if (descField) {
             if (typeof descField === 'string') {
                 description = descField
             } else if (descField.type === 'doc' && Array.isArray(descField.content)) {
                 // simplify ADF to plain text simply by extracting text nodes
                 const extractText = (node: any): string => {
                    if (node.type === 'text') return node.text || ''
                    if (node.type === 'hardBreak') return '\n'
                    if (Array.isArray(node.content)) {
                       const text = node.content.map(extractText).join('')
                       return node.type === 'paragraph' ? text + '\n' : text
                    }
                    return ''
                 }
                 description = descField.content.map(extractText).join('').trim()
             }
        }
        
        addToast(`✅ Successfully imported Jira issue: ${key}`, 'success')
        return { summary, description }
      }
    } catch (err: any) {
      addToast(`Network error: ${err.message}`, 'error')
      return null
    } finally {
      setImporting(false)
    }
  }

  return { importFromJira, importing }
}
