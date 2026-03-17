import { useCallback, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToastStore } from '@/stores/toastStore'

export interface ConfluenceExportProgress {
  done: number
  total: number
}

export function useConfluenceExport() {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<ConfluenceExportProgress>({ done: 0, total: 0 })

  const { 
    confluenceUrl, 
    confluenceEmail, 
    confluenceToken, 
    confluenceSpaceKey,
    confluenceParentPageId 
  } = useUIStore()
  const addToast = useToastStore((state) => state.addToast)

  const exportToConfluence = useCallback(async (title: string, content: string) => {
    if (!confluenceUrl || !confluenceEmail || !confluenceToken || !confluenceSpaceKey) {
      addToast('Please configure Confluence settings first (Settings → Confluence).', 'warning')
      return
    }

    setExporting(true)
    setProgress({ done: 0, total: 1 })

    try {
      const res = await fetch('/api/confluence/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confluenceUrl: confluenceUrl.trim().replace(/\/$/, ''),
          email: confluenceEmail.trim(),
          token: confluenceToken.trim(),
          spaceKey: confluenceSpaceKey.trim(),
          parentPageId: confluenceParentPageId?.trim(),
          title,
          content, // Should be in Confluence Storage Format (XHTML-ish)
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = errData?.error || `HTTP ${res.status}`
        addToast(`Failed to export to Confluence: ${msg}`, 'error')
        return null
      } else {
        const data = await res.json()
        addToast(`✅ Exported to Confluence: ${data.title}`, 'success')
        return data // { id, title, url }
      }
    } catch (err: any) {
      addToast(`Network error: ${err.message}`, 'error')
      return null
    } finally {
      setProgress({ done: 1, total: 1 })
      setExporting(false)
    }
  }, [confluenceUrl, confluenceEmail, confluenceToken, confluenceSpaceKey, confluenceParentPageId, addToast])

  return { exportToConfluence, exporting, progress }
}
