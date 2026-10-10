import { useCallback, useRef, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'

export interface QaTicketDef {
  key: string
  prefix: string
}

export interface QaPreviewItem {
  key: string
  title: string
  willCreate: boolean
  existingKey: string | null
  existingUrl: string | null
}

export interface QaPreviewResult {
  projectKey: string
  parentKey: string
  parentTitle: string
  items: QaPreviewItem[]
  toCreateCount: number
  toSkipCount: number
}

export interface QaCreateResultItem {
  status: 'created' | 'skipped'
  key: string
  title: string
  url: string
}

export interface QaSlackResult {
  sent: boolean
  reason?: string
}

export interface QaIssueTypesResult {
  projectKey: string
  issueTypes: string[]
}

export interface QaCreateResult {
  parentKey: string
  parentTitle: string
  results: QaCreateResultItem[]
  slack: QaSlackResult
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return data?.error || `HTTP ${res.status}`
}

export function useQaTaskCreator() {
  const { jiraUrl, jiraEmail, jiraToken, slackNotificationsEnabled, slackBotToken, slackChannel } =
    useUIStore()
  const toast = useToast()

  const [previewing, setPreviewing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<QaPreviewResult | null>(null)
  const [result, setResult] = useState<QaCreateResult | null>(null)
  const [issueTypes, setIssueTypes] = useState<string[]>([])
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false)
  // Sequence number of the latest issue-types lookup; older responses that
  // arrive late are dropped so they can't overwrite a newer project's list.
  const issueTypesRequestId = useRef(0)

  const hasJiraConfig = Boolean(jiraUrl.trim() && jiraEmail.trim() && jiraToken.trim())

  const buildBody = (parentLink: string, selectedKeys: string[], issueType?: string, assignee?: string) => ({
    jiraUrl: jiraUrl.trim().replace(/\/$/, ''),
    jiraEmail: jiraEmail.trim(),
    jiraToken: jiraToken.trim(),
    parentLink: parentLink.trim(),
    selectedKeys,
    issueType: issueType?.trim() || undefined,
    assignee: assignee?.trim() || undefined,
    slackEnabled: slackNotificationsEnabled,
    slackBotToken: slackBotToken.trim(),
    slackChannel: slackChannel.trim(),
  })

  const runPreview = useCallback(
    async (parentLink: string, selectedKeys: string[], issueType?: string, assignee?: string) => {
      if (!hasJiraConfig) {
        toast.warning('Please configure Jira settings first (Settings → Jira).')
        return null
      }
      if (!parentLink.trim()) {
        toast.warning('Parent ticket link is required.')
        return null
      }
      if (selectedKeys.length === 0) {
        toast.warning('Select at least one ticket type.')
        return null
      }

      setPreviewing(true)
      setResult(null)
      try {
        const res = await fetch('/api/qa-tasks/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(parentLink, selectedKeys, issueType, assignee)),
        })
        if (!res.ok) {
          toast.error(await readError(res))
          setPreview(null)
          return null
        }
        const data: QaPreviewResult = await res.json()
        setPreview(data)
        return data
      } catch (err: any) {
        toast.error(`Network error: ${err.message}`)
        setPreview(null)
        return null
      } finally {
        setPreviewing(false)
      }
    },
    [jiraUrl, jiraEmail, jiraToken, slackNotificationsEnabled, slackBotToken, slackChannel, hasJiraConfig, toast],
  )

  const runCreate = useCallback(
    async (parentLink: string, selectedKeys: string[], issueType?: string, assignee?: string) => {
      if (!hasJiraConfig) {
        toast.warning('Please configure Jira settings first (Settings → Jira).')
        return null
      }

      setCreating(true)
      try {
        const res = await fetch('/api/qa-tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(parentLink, selectedKeys, issueType, assignee)),
        })
        if (!res.ok) {
          toast.error(await readError(res))
          return null
        }
        const data: QaCreateResult = await res.json()
        setResult(data)
        const createdCount = data.results.filter((r) => r.status === 'created').length
        const skippedCount = data.results.filter((r) => r.status === 'skipped').length
        toast.success(`Done — ${createdCount} created, ${skippedCount} already existed.`)
        if (slackNotificationsEnabled && !data.slack.sent) {
          toast.warning(`Slack notification not sent: ${data.slack.reason}`)
        }
        return data
      } catch (err: any) {
        toast.error(`Network error: ${err.message}`)
        return null
      } finally {
        setCreating(false)
      }
    },
    [jiraUrl, jiraEmail, jiraToken, slackNotificationsEnabled, slackBotToken, slackChannel, hasJiraConfig, toast],
  )

  const fetchIssueTypes = useCallback(
    async (parentLink: string) => {
      const requestId = ++issueTypesRequestId.current
      const isLatest = () => requestId === issueTypesRequestId.current

      if (!hasJiraConfig || !parentLink.trim()) {
        setIssueTypes([])
        setLoadingIssueTypes(false)
        return
      }

      setIssueTypes([])
      setLoadingIssueTypes(true)
      try {
        const res = await fetch('/api/qa-tasks/issue-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jiraUrl: jiraUrl.trim().replace(/\/$/, ''),
            jiraEmail: jiraEmail.trim(),
            jiraToken: jiraToken.trim(),
            parentLink: parentLink.trim(),
          }),
        })
        if (!isLatest()) return
        if (!res.ok) {
          setIssueTypes([])
          return
        }
        const data: QaIssueTypesResult = await res.json()
        if (!isLatest()) return
        setIssueTypes(data.issueTypes)
      } catch {
        // Silent — this runs in the background while the user is still
        // typing the parent link, so a stale/invalid link mid-edit
        // shouldn't surface as an error toast. The dropdown just falls
        // back to the default until a valid link resolves.
        if (isLatest()) setIssueTypes([])
      } finally {
        if (isLatest()) setLoadingIssueTypes(false)
      }
    },
    [jiraUrl, jiraEmail, jiraToken, hasJiraConfig],
  )

  const reset = useCallback(() => {
    setPreview(null)
    setResult(null)
  }, [])

  return {
    hasJiraConfig,
    previewing,
    creating,
    preview,
    result,
    issueTypes,
    loadingIssueTypes,
    fetchIssueTypes,
    runPreview,
    runCreate,
    reset,
  }
}
