import { useState, useRef, useEffect } from 'react'
import { Bug, Sparkles, Copy, Trash2, ChevronDown, Table2, AlignJustify, Upload, Check, ExternalLink, X } from 'lucide-react'
import { useBugReport } from '@/hooks/useBugReport'
import { useToast } from '@/hooks/useToast'
import { useJiraExport } from '@/hooks/useJiraExport'
import { useNavigate } from 'react-router-dom'
import ResultTable from '@/components/ResultTable/ResultTable'
import LinkWorkItemModal from '@/components/Modal/LinkWorkItemModal'

const BugReportPage = () => {
  const [bugDetails, setBugDetails] = useState('')
  const [showSmartCopyMenu, setShowSmartCopyMenu] = useState(false)
  const [exportedJiraData, setExportedJiraData] = useState<{ key: string; url: string } | null>(null)
  const [copyStatus, setCopyStatus] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const { generateReport, loading, bugData } = useBugReport()
  const { exportToJira, exporting, progress } = useJiraExport()
  const toast = useToast()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSmartCopyMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleGenerate = () => {
    setExportedJiraData(null) // Reset banner on new generate
    generateReport(bugDetails)
  }

  const handleExportClick = () => {
    if (!bugData) return
    setIsLinkModalOpen(true)
  }

  const handleExportToJira = async (linkConfig: { jiraUrl: string; linkType: string; issueType: string }) => {
    if (!bugData) return
    const result = await exportToJira(bugData, linkConfig)
    if (result) {
      setExportedJiraData(result)
      setIsLinkModalOpen(false)
    }
  }

  const copyJiraLink = () => {
    if (!exportedJiraData) return
    navigator.clipboard.writeText(exportedJiraData.url)
    setCopyStatus(true)
    setTimeout(() => setCopyStatus(false), 2000)
    toast.success('Link copied to clipboard!')
  }



  // Helper to convert internal HTML to clean HTML for Jira (preserving <strong> and <br>)
  const cleanToHtml = (html: string) => {
    return html
      // Normalize <br> variants
      .replace(/<br\s*\/?>/gi, '<br>')
      // Add a blank line BEFORE each section header (<strong>) for readability
      .replace(/<strong>/gi, '<br><strong>')
      // Restore: no leading <br> before the very first element
      .replace(/^<br>/, '')
      // Convert actual newlines to <br>
      .replace(/\n+/g, '<br>')
      // Collapse multiple spaces
      .replace(/ {2,}/g, ' ')
      .trim()
  }

  const performSmartCopy = async (includeHeader: boolean) => {
    if (!bugData || bugData.length <= 1) return
    setShowSmartCopyMenu(false)

    const headers = bugData[0]
    const rows = bugData.slice(1)

    // Build HTML table — Jira's ProseMirror editor reads text/html from clipboard
    const thCells = headers.map(h => `<th style="border:1px solid #ccc;padding:6px;background:#f4f5f7;font-weight:bold;">${h}</th>`).join('')
    const trHeader = `<tr>${thCells}</tr>`

    const bodyRows = rows.map(row => {
      const tdCells = row.map(cell =>
        `<td style="border:1px solid #ccc;padding:6px;vertical-align:top;">${cleanToHtml(String(cell))}</td>`
      ).join('')
      return `<tr>${tdCells}</tr>`
    }).join('')

    const htmlTable = `
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;">
        ${includeHeader ? `<thead>${trHeader}</thead>` : ''}
        <tbody>${bodyRows}</tbody>
      </table>`

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([htmlTable], { type: 'text/plain' }),
        })
      ])
      toast.success(includeHeader ? 'Copied with header — paste into Jira!' : 'Copied without header — paste into Jira!')
    } catch {
      navigator.clipboard.writeText(htmlTable)
        .then(() => toast.success('HTML table copied!'))
        .catch(() => toast.error('Failed to copy.'))
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
        Bug Report Generator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Turn messy bug findings into professional, structured QA reports.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          placeholder="Explain the bug you found (steps, observations)..."
          className="w-full h-48 px-5 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200"
          value={bugDetails}
          onChange={(e) => setBugDetails(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => setBugDetails('')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-500 rounded-xl transition-all text-sm font-medium hover-scale w-full sm:w-auto border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
          >
            <Trash2 size={16} />
            Clear Input
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Smart Copy with dropdown */}
            {bugData && (
              <div className="relative w-full sm:w-auto" ref={menuRef}>
                <button
                  onClick={() => setShowSmartCopyMenu(prev => !prev)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all hover-scale w-full sm:w-auto"
                  title="Smart Copy for Jira"
                >
                  <Sparkles size={18} />
                  Smart Copy
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showSmartCopyMenu ? 'rotate-180' : ''}`} />
                </button>

                {showSmartCopyMenu && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paste to Jira</p>
                    </div>
                    <button
                      onClick={() => performSmartCopy(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <Table2 size={16} className="text-indigo-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Copy with Header</div>
                        <div className="text-xs text-slate-400">Includes column names</div>
                      </div>
                    </button>
                    <button
                      onClick={() => performSmartCopy(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                    >
                      <AlignJustify size={16} className="text-indigo-400 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Copy without Header</div>
                        <div className="text-xs text-slate-400">Data rows only</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Export to Jira */}
            {bugData && (
              <button
                onClick={handleExportClick}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-1 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-xl transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed hover-scale group w-full sm:w-auto"
                title="Export to Jira"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Exporting {progress.done}/{progress.total}...</span>
                  </>
                ) : (
                  <>
                    <img src="/assets/icons/jira-icon.png" alt="Jira" className="w-4 h-4 object-contain" />
                    Export to Jira
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover-scale w-full sm:w-auto"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Bug size={20} />
              )}
              {loading ? 'Generating...' : 'Generate Bug Report'}
            </button>
          </div>
        </div>
      </div>

      {bugData && (
        <div className="space-y-4 w-full min-w-0 animate-in fade-in zoom-in-95 duration-500">
          {/* Success Banner */}
          {exportedJiraData && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                  <Check size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Export Success!</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jira Issue:</span>
                    <a 
                      href={exportedJiraData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {exportedJiraData.key}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyJiraLink}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
                >
                  {copyStatus ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copyStatus ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => setExportedJiraData(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-bold uppercase tracking-widest">Structured Bug Report</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
          </div>
          <div className="w-full max-w-full overflow-hidden rounded-xl">
            <ResultTable 
              headers={bugData[0]} 
              rows={bugData.slice(1)} 
            />
          </div>
        </div>
      )}
      <LinkWorkItemModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onExport={handleExportToJira}
        exporting={exporting}
      />
    </div>
  )
}

export default BugReportPage
