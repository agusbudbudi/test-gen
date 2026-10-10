import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  ExternalLink,
  CheckCircle2,
  Circle,
  Loader2,
  Settings as SettingsIcon,
  Slack as SlackIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useQaTaskCreator, type QaTicketDef } from '@/hooks/useQaTaskCreator'
import Checkbox from '@/components/Checkbox/Checkbox'
import Dropdown from '@/components/Dropdown/Dropdown'
import { cn } from '@/lib/utils'

const QaTaskCreatorPage = () => {
  const navigate = useNavigate()
  const { jiraUrl, jiraEmail, jiraToken } = useUIStore()
  const {
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
  } = useQaTaskCreator()

  const DEFAULT_ISSUE_TYPE = 'Testing Task'

  const [ticketDefs, setTicketDefs] = useState<QaTicketDef[]>([])
  const [parentLink, setParentLink] = useState('')
  const [issueType, setIssueType] = useState(DEFAULT_ISSUE_TYPE)
  const [assignee, setAssignee] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  const isConfigured = Boolean(jiraUrl.trim() && jiraEmail.trim() && jiraToken.trim())
  const canPreview = isConfigured && !previewing && Boolean(parentLink.trim()) && selectedKeys.length > 0

  useEffect(() => {
    fetch('/api/qa-tasks/ticket-defs')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { ticketDefs?: QaTicketDef[] }) => {
        if (!Array.isArray(data.ticketDefs)) return
        setTicketDefs(data.ticketDefs)
        setSelectedKeys(data.ticketDefs.map((d) => d.key))
      })
      .catch(() => {
        // Static list rarely changes; leave selection empty if the fetch fails
        // rather than guessing at a stale hardcoded copy.
      })
  }, [])

  // Debounced live lookup of this project's real Jira issue types as the
  // user pastes/edits the parent link, rather than fetching on every
  // keystroke.
  useEffect(() => {
    if (!parentLink.trim()) {
      fetchIssueTypes('')
      return
    }
    const handle = setTimeout(() => fetchIssueTypes(parentLink), 600)
    return () => clearTimeout(handle)
  }, [parentLink, fetchIssueTypes])

  // Default to "Testing Task" once the real list loads, falling back to the
  // first available type if this project doesn't have one.
  useEffect(() => {
    if (issueTypes.length === 0) {
      setIssueType(DEFAULT_ISSUE_TYPE)
      return
    }
    const match = issueTypes.find((t) => t.toLowerCase() === DEFAULT_ISSUE_TYPE.toLowerCase())
    setIssueType(match ?? issueTypes[0])
  }, [issueTypes])

  // Any edit after a preview invalidates it, so "Confirm & Create" can only
  // ever submit exactly what was previewed.
  useEffect(() => {
    reset()
  }, [parentLink, selectedKeys, issueType, assignee, reset])

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handlePreview = () => {
    reset()
    runPreview(parentLink, selectedKeys, issueType, assignee)
  }

  const handleCreate = () => {
    runCreate(parentLink, selectedKeys, issueType, assignee)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ClipboardCheck size={20} className="text-primary" />
          Create QA Tasks
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Create the 6 standard QA tickets (Create Test Case, Sandbox/Staging/Pre-Release/Production
          Test Execution, UAT) as children of a parent Jira ticket.
        </p>
      </div>

      {!isConfigured && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Jira is not configured yet. Set your Jira Domain, Email and API Token first.
          </p>
          <button
            onClick={() => navigate('/settings?tab=jira')}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
          >
            <SettingsIcon size={12} />
            Go to Settings
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-6">
        {/* Parent link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Parent Ticket Link
          </label>
          <input
            type="url"
            placeholder="https://yourdomain.atlassian.net/browse/PROJ-123"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
            value={parentLink}
            onChange={(e) => setParentLink(e.target.value)}
          />
        </div>

        {/* Optional overrides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Issue Type <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Dropdown
              value={issueType}
              onChange={setIssueType}
              options={issueTypes.length === 0 ? [DEFAULT_ISSUE_TYPE] : issueTypes}
              loading={loadingIssueTypes}
              placeholder={DEFAULT_ISSUE_TYPE}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {loadingIssueTypes
                ? 'Loading issue types from Jira…'
                : issueTypes.length === 0
                  ? 'Paste a parent ticket link to load this project’s issue types.'
                  : `${issueTypes.length} issue type${issueTypes.length === 1 ? '' : 's'} from this Jira project.`}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Assignee <span className="text-slate-400 font-normal">(optional, defaults to you)</span>
            </label>
            <input
              type="text"
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-slate-200"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>
        </div>

        {/* Ticket type checkboxes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ticket Types
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {ticketDefs.map((def) => (
              <Checkbox
                key={def.key}
                label={def.prefix}
                checked={selectedKeys.includes(def.key)}
                onChange={() => toggleKey(def.key)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handlePreview}
            disabled={!canPreview}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors text-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed',
              canPreview
                ? 'border-primary/50 hover:border-primary'
                : 'border-transparent',
            )}
          >
            {previewing && <Loader2 size={15} className="animate-spin" />}
            Preview
          </button>
          <button
            onClick={handleCreate}
            disabled={!preview || creating}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating && <Loader2 size={15} className="animate-spin" />}
            Confirm &amp; Create
          </button>
        </div>
      </div>

      {/* Preview results */}
      {preview && !result && (
        <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">
              Preview — {preview.parentKey}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {preview.parentTitle} · {preview.toCreateCount} to create, {preview.toSkipCount} already exist
            </p>
          </div>
          <div className="space-y-2">
            {preview.items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-sm"
              >
                <span className="text-slate-700 dark:text-slate-300">{item.title}</span>
                {item.willCreate ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary flex-shrink-0">
                    <Circle size={12} /> Will create
                  </span>
                ) : (
                  <a
                    href={item.existingUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline flex-shrink-0"
                  >
                    Already exists — {item.existingKey} <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create results */}
      {result && (
        <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">
              Done — {result.parentKey}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{result.parentTitle}</p>
          </div>
          <div className="space-y-2">
            {result.results.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-sm"
              >
                <span className="text-slate-700 dark:text-slate-300">{item.title}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium flex-shrink-0 hover:underline text-primary"
                >
                  {item.status === 'created' ? (
                    <>
                      <CheckCircle2 size={12} /> Created — {item.key}
                    </>
                  ) : (
                    <>Already exists — {item.key}</>
                  )}
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
          <div
            className={cn(
              'flex items-center gap-2 text-xs font-medium',
              result.slack.sent ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500',
            )}
          >
            <SlackIcon size={13} />
            {result.slack.sent
              ? 'Slack notification sent.'
              : `Slack notification not sent — ${result.slack.reason}`}
          </div>
        </div>
      )}
    </div>
  )
}

export default QaTaskCreatorPage
