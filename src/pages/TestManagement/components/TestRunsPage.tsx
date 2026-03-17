import React, { useState, useRef, useCallback } from 'react'
import { Plus, Play, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, FileText, ClipboardList, BarChart3, Clock, History, Activity, Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useTestCaseStore, TestRun, TestRunItem, RunItemStatus, ActivityLog } from '@/stores/testCaseStore'
import CreateTestRunModal from './CreateTestRunModal'
import EditTestRunModal from './EditTestRunModal'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<RunItemStatus, { label: string; color: string; bg: string; border: string }> = {
  'UNTESTED': { label: 'Untested', color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  'PASSED':   { label: 'Passed',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
  'FAILED':   { label: 'Failed',   color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20' },
  'BLOCKED':  { label: 'Blocked',  color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
  'SKIPPED':  { label: 'Skipped',  color: 'text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700' },
}

const ALL_STATUSES: RunItemStatus[] = ['UNTESTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED']

// ─── Progress bar ──────────────────────────────────────────────────────────────
interface RunProgressBarProps {
  items: TestRunItem[]
  showReportToggle?: boolean
  isReportExpanded?: boolean
  onToggleReport?: () => void
  onDownload?: () => void
}

const RunProgressBar: React.FC<RunProgressBarProps> = ({ 
  items, 
  showReportToggle, 
  isReportExpanded, 
  onToggleReport,
  onDownload
}) => {
  const total = items.length
  if (total === 0) return <span className="text-xs text-slate-400">No items</span>

  const counts = {
    PASSED:  items.filter(i => i.status === 'PASSED').length,
    FAILED:  items.filter(i => i.status === 'FAILED').length,
    BLOCKED: items.filter(i => i.status === 'BLOCKED').length,
    SKIPPED: items.filter(i => i.status === 'SKIPPED').length,
  }
  const notRun = total - counts.PASSED - counts.FAILED - counts.BLOCKED - counts.SKIPPED

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
          {counts.PASSED  > 0 && <div style={{ width: `${(counts.PASSED  / total) * 100}%` }} className="bg-emerald-500 transition-all h-full" />}
          {counts.FAILED  > 0 && <div style={{ width: `${(counts.FAILED  / total) * 100}%` }} className="bg-red-500 transition-all h-full" />}
          {counts.BLOCKED > 0 && <div style={{ width: `${(counts.BLOCKED / total) * 100}%` }} className="bg-orange-500 transition-all h-full" />}
          {counts.SKIPPED > 0 && <div style={{ width: `${(counts.SKIPPED / total) * 100}%` }} className="bg-slate-400 transition-all h-full" />}
        </div>
        <div className="flex items-center gap-1.5 ml-4 shrink-0">
          {showReportToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleReport?.(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-md"
            >
              <BarChart3 size={12} />
              {isReportExpanded ? 'Hide Report' : 'See Report'}
            </button>
          )}
          {isReportExpanded && onDownload && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
            >
              <Download size={12} />
              Download
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {counts.PASSED  > 0 && <span className="text-[10px] text-emerald-600 font-medium">{counts.PASSED} Passed</span>}
        {counts.FAILED  > 0 && <span className="text-[10px] text-red-600 font-medium">{counts.FAILED} Failed</span>}
        {counts.BLOCKED > 0 && <span className="text-[10px] text-orange-600 font-medium">{counts.BLOCKED} Blocked</span>}
        {counts.SKIPPED > 0 && <span className="text-[10px] text-slate-400 font-medium">{counts.SKIPPED} Skipped</span>}
        {notRun > 0 && <span className="text-[10px] text-slate-400">{notRun} Untested</span>}
      </div>
    </div>
  )
}

// ─── Report Detail Component ──────────────────────────────────────────────────
const RunReportDetail = React.forwardRef<HTMLDivElement, { 
  items: TestRunItem[]; 
  runName: string;
  isExporting?: boolean;
  exportTimestamp?: string;
}>(
  ({ items, runName, isExporting, exportTimestamp }, ref) => {
    const total = items.length

    if (total === 0) return null

    const stats = [
      { status: 'PASSED',  color: '#10b981', label: 'Passed' },
      { status: 'FAILED',  color: '#ef4444', label: 'Failed' },
      { status: 'BLOCKED', color: '#f97316', label: 'Blocked' },
      { status: 'SKIPPED', color: '#94a3b8', label: 'Skipped' },
      { status: 'UNTESTED', color: '#e2e8f0', label: 'Untested' },
    ].map(s => {
      const count = items.filter(i => i.status === s.status).length
      const percentage = Math.round((count / total) * 100)
      return { ...s, count, percentage }
    })

  // Calculate SVG pie slices
  let cumulativePercentage = 0
  const slices = stats.filter(s => s.count > 0).map((s, i) => {
    const startX = Math.cos(2 * Math.PI * (cumulativePercentage / 100))
    const startY = Math.sin(2 * Math.PI * (cumulativePercentage / 100))
    cumulativePercentage += s.percentage
    const endX = Math.cos(2 * Math.PI * (cumulativePercentage / 100))
    const endY = Math.sin(2 * Math.PI * (cumulativePercentage / 100))
    
    // For single slice representing 100%, we use a circle
    if (s.percentage === 100) {
      return <circle key={s.status} cx="0" cy="0" r="1" fill={s.color} />
    }

    const largeArcFlag = s.percentage > 50 ? 1 : 0
    const d = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    
    return <path key={s.status} d={d} fill={s.color} />
  })

    return (
      <div className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
        <div ref={ref} className="p-10 bg-white dark:bg-surface-card overflow-hidden">
          <div className={cn("mb-6", !isExporting && "hidden")}>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">{runName}</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Test Execution Report • {exportTimestamp}</p>
          </div>

        <div className="flex flex-col md:flex-row items-start gap-16">
          {/* Pie Chart */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
            <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
              {slices}
            </svg>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 flex-1">
            {stats.map(s => (
              <div key={s.status} className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                      {s.count}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">
                    {s.percentage}% set to {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Passed Percentage Summary Widget */}
          <div className="flex flex-col items-center md:items-start justify-center px-8 min-w-[170px]">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-emerald-500 tracking-tighter">
                {stats.find(s => s.status === 'PASSED')?.percentage || 0}%
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest mb-3">passed</span>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {stats.find(s => s.status === 'UNTESTED')?.count || 0} / {total} untested
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                ({stats.find(s => s.status === 'UNTESTED')?.percentage || 0}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Header is managed by isExporting prop */
      `}</style>
    </div>
  )
}
)

RunReportDetail.displayName = 'RunReportDetail'

// ─── Main page ─────────────────────────────────────────────────────────────────
const TestRunsPage: React.FC = () => {
  const {
    testRuns,
    selectedRunId,
    setSelectedRunId,
    deleteTestRun,
    updateTestRun,
    updateRunItem,
    bulkUpdateRunItems,
  } = useTestCaseStore()

  const toast = useToast()
  const reportRef = useRef<HTMLDivElement>(null)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isReportExpanded, setReportExpanded] = useState(false)
  const [selectedRunItemId, setSelectedRunItemId] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [exportTimestamp, setExportTimestamp] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const selectedRun = testRuns.find(r => r.id === selectedRunId) ?? null

  const handleToggleReport = () => setReportExpanded(!isReportExpanded)
  const toggleGroupCollapse = (fid: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(fid)) next.delete(fid)
      else next.add(fid)
      return next
    })
  }

  const handleDownloadReport = useCallback(async () => {
    if (!reportRef.current || !selectedRun) return

    const timestamp = new Date().toLocaleString('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    })
    
    setExportTimestamp(timestamp)
    setIsExporting(true)
    
    // Wait for state update to render the header
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(reportRef.current!, { 
          cacheBust: true, 
          backgroundColor: '#ffffff', 
          pixelRatio: 3, // Higher quality
        })
        
        const link = document.createElement('a')
        link.download = `Report-${selectedRun.name.replace(/\s+/g, '-')}-${new Date().getTime()}.png`
        link.href = dataUrl
        link.click()
        toast.success('Report image downloaded')
      } catch (err) {
        console.error('oops, something went wrong!', err)
        toast.error('Failed to download report image')
      } finally {
        setIsExporting(false)
      }
    }, 100)
  }, [selectedRun, toast])

  const handleOpenEdit = () => {
    if (selectedRun) setEditModalOpen(true)
  }

  const handleDelete = (runId: string) => {
    if (!confirm('Delete this test run? This cannot be undone.')) return
    deleteTestRun(runId)
    toast.success('Test run deleted')
    setSelectedItemIds(new Set())
  }

  const toggleSelectAll = () => {
    if (!selectedRun) return
    if (selectedItemIds.size === selectedRun.items.length) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(selectedRun.items.map(item => item.id)))
    }
  }

  const toggleSelectItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedItemIds)
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    setSelectedItemIds(next)
  }

  const handleBulkStatusUpdate = (status: RunItemStatus) => {
    if (!selectedRunId || selectedItemIds.size === 0) return
    bulkUpdateRunItems(selectedRunId, Array.from(selectedItemIds), { status })
    toast.success(`Updated status to ${status} for ${selectedItemIds.size} items`)
    setSelectedItemIds(new Set())
  }

  return (
    <div className="flex flex-1 gap-0 min-h-0 relative">
      {/* ── Left Panel: Run List ── */}
      <div className="w-72 shrink-0 flex flex-col bg-white dark:bg-surface-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
            <Play className="text-primary" size={18} />
            Test Runs
            <span className="ml-1 text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
              {testRuns.length}
            </span>
          </h2>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="New Test Run"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {testRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4 mt-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-3">
                <ClipboardList className="text-slate-400" size={24} />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No test runs yet</p>
              <p className="text-xs text-slate-500 mt-1">Click <strong>+</strong> to create your first run</p>
            </div>
          ) : (
            testRuns.map(run => (
              <button
                key={run.id}
                onClick={() => {
                  setSelectedRunId(run.id)
                  setSelectedRunItemId(null)
                  setSelectedItemIds(new Set())
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-all group border',
                  selectedRunId === run.id
                    ? 'bg-primary/5 text-primary border-primary/20 shadow-sm shadow-primary/5'
                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold truncate pr-2 flex-1">{run.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {run.items.length} TC
                  </span>
                </div>
                {run.description && (
                  <p className="text-[11px] text-slate-500 truncate mb-1.5">{run.description}</p>
                )}
                <RunProgressBar items={run.items} />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {new Date(run.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {testRuns.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium shadow-sm shadow-primary/20"
            >
              <Plus size={16} />
              New Run
            </button>
          </div>
        )}
      </div>

      {/* Resizer visual divider */}
      <div className="w-3 shrink-0" />

      {/* ── Right Panel: Run Detail ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-surface-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-w-0">
        {!selectedRun ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-4">
              <BarChart3 className="text-slate-400 dark:text-slate-500" size={36} />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Select a Test Run</h3>
            <p className="text-sm text-slate-500">Choose a run from the left panel to view and update results</p>
          </div>
        ) : (
          <>
            {/* Run header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-white truncate">{selectedRun.name}</h2>
                {selectedRun.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedRun.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleOpenEdit}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Edit run"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(selectedRun.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  title="Delete run"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Run summary strip */}
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-card shrink-0">
              <RunProgressBar 
                items={selectedRun.items} 
                showReportToggle 
                isReportExpanded={isReportExpanded}
                onToggleReport={handleToggleReport}
                onDownload={handleDownloadReport}
              />
            </div>

            {/* Visual Report Detail */}
            {isReportExpanded && (
              <RunReportDetail 
                ref={reportRef} 
                items={selectedRun.items} 
                runName={selectedRun.name} 
                isExporting={isExporting}
                exportTimestamp={exportTimestamp}
              />
            )}

            {/* Main Content Area: Table + Side Panel */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              {/* Items table */}
              <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                selectedRunItemId ? "border-r border-slate-200 dark:border-slate-800" : ""
              )}>
                {selectedRun.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <FileText className="text-slate-300 dark:text-slate-600 mb-3" size={32} />
                    <p className="text-sm text-slate-500">This run has no test cases.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {/* Table header */}
                    <div className={cn(
                      "grid gap-0 px-0 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 items-center transition-all",
                      selectedRunItemId 
                        ? "grid-cols-[48px_80px_1fr]" 
                        : "grid-cols-[48px_80px_1fr_125px_160px]"
                    )}>
                      <div className="flex items-center justify-center h-full">
                        <label className="w-12 h-full flex items-center justify-center cursor-pointer group/checkbox relative">
                          <input
                            type="checkbox"
                            checked={selectedRun.items.length > 0 && selectedItemIds.size === selectedRun.items.length}
                            onChange={toggleSelectAll}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 rounded-md border-1 transition-all duration-300 flex items-center justify-center select-none",
                            selectedRun.items.length > 0 && selectedItemIds.size === selectedRun.items.length
                              ? "bg-primary border-primary shadow-lg shadow-primary/40 scale-110"
                              : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover/checkbox:border-primary group-hover/checkbox:scale-105"
                          )}>
                            {selectedRun.items.length > 0 && selectedItemIds.size === selectedRun.items.length && (
                              <Check size={10} className="text-white animate-in zoom-in fade-in duration-300" strokeWidth={3.5} />
                            )}
                          </div>
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-3">TC ID</span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-3">Title</span>
                      {!selectedRunItemId && (
                        <>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-3">Status</span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest pl-3">Notes</span>
                        </>
                      )}
                    </div>

                    {/* Grouping items by folder */}
                    {(() => {
                      const { folders: allFolders } = useTestCaseStore.getState()
                      
                      // Group items by folderId
                      const groups: Record<string, TestRunItem[]> = {}
                      selectedRun.items.forEach(item => {
                        const fid = item.folderId || 'root'
                        if (!groups[fid]) groups[fid] = []
                        groups[fid].push(item)
                      })

                      // Sort groups: root first, then by folder name
                      const sortedFolderIds = Object.keys(groups).sort((a, b) => {
                        if (a === 'root') return -1
                        if (b === 'root') return 1
                        const folderA = allFolders.find(f => f.id === a)
                        const folderB = allFolders.find(f => f.id === b)
                        return (folderA?.name || '').localeCompare(folderB?.name || '')
                      })

                      return sortedFolderIds.map(fid => {
                        const items = groups[fid]
                        const folder = fid === 'root' ? null : allFolders.find(f => f.id === fid)
                        const isCollapsed = collapsedGroups.has(fid)
                        
                        return (
                          <div key={fid}>
                            {/* Folder Header */}
                            <div 
                              onClick={() => toggleGroupCollapse(fid)}
                              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sticky top-[33px] z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group/header"
                            >
                              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 group-hover/header:border-primary transition-colors">
                                {isCollapsed ? (
                                  <ChevronRight size={12} className="text-slate-400 group-hover/header:text-primary" />
                                ) : (
                                  <ChevronDown size={12} className="text-slate-400 group-hover/header:text-primary" />
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-1">
                                {folder ? folder.name : 'Unfolderized / Root'}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                                {items.length}
                              </span>
                            </div>

                            {/* Group Items */}
                            {!isCollapsed && items.map(item => {
                              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['UNTESTED']
                              const isSelected = selectedItemIds.has(item.id)
                              const isActive = selectedRunItemId === item.id

                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => setSelectedRunItemId(isActive ? null : item.id)}
                                  className={cn(
                                    "border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 transition-all cursor-pointer",
                                    isSelected && "bg-primary/[0.03] dark:bg-primary/[0.05]",
                                    isActive && "bg-primary/5 dark:bg-primary/10 border-l-3 border-l-primary"
                                  )}
                                >
                                  {/* Row */}
                                  <div className={cn(
                                    "grid gap-0 items-center px-0 py-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                    selectedRunItemId 
                                      ? "grid-cols-[48px_80px_1fr]" 
                                      : "grid-cols-[48px_80px_1fr_125px_160px]"
                                  )}>
                                    {/* Checkbox */}
                                    <div className="h-full flex items-center justify-center self-stretch">
                                      <label
                                        className={cn(
                                          "w-12 self-stretch flex items-center justify-center transition-all cursor-pointer group/checkbox relative",
                                          isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const next = new Set(selectedItemIds)
                                            if (e.target.checked) next.add(item.id)
                                            else next.delete(item.id)
                                            setSelectedItemIds(next)
                                          }}
                                          className="sr-only"
                                        />
                                        <div className={cn(
                                          "w-4 h-4 rounded-md border-1 transition-all duration-300 flex items-center justify-center select-none",
                                          isSelected
                                            ? "bg-primary border-primary shadow-lg shadow-primary/40 scale-110"
                                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover/checkbox:border-primary group-hover/checkbox:scale-105"
                                        )}>
                                          {isSelected && (
                                            <Check size={10} className="text-white animate-in zoom-in fade-in duration-300" strokeWidth={3.5} />
                                          )}
                                        </div>
                                      </label>
                                    </div>
                                    
                                    {/* TC ID */}
                                    <div className="pl-3 py-2.5">
                                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 w-fit">
                                        {item.tcId}
                                      </span>
                                    </div>

                                    {/* Title */}
                                    <div className="pl-3 py-2.5 min-w-0">
                                      <div className="flex items-center gap-1.5 text-left group min-w-0 w-full">
                                        <span className={cn(
                                          "text-sm truncate transition-colors font-medium",
                                          isActive ? "text-primary" : "text-slate-700 dark:text-slate-300 group-hover:text-primary"
                                        )}>
                                          {item.title}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Status and Notes (combined condition) */}
                                    {!selectedRunItemId && (
                                      <>
                                        {/* Status Selection */}
                                        <div className="px-2 py-2 flex justify-center" onClick={e => e.stopPropagation()}>
                                          <div className="relative w-[90px]">
                                            <select
                                              value={item.status}
                                              onChange={e =>
                                                updateRunItem(selectedRun.id, item.id, { status: e.target.value as RunItemStatus })
                                              }
                                              className={cn(
                                                'w-full text-[10px] font-bold uppercase px-2 py-1 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-6 transition-all',
                                                cfg.bg, cfg.color, cfg.border
                                              )}
                                            >
                                              {ALL_STATUSES.map(s => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                              ))}
                                            </select>
                                            <ChevronDown size={10} className={cn('absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60', cfg?.color || 'text-slate-400')} />
                                          </div>
                                        </div>

                                        {/* Notes inline */}
                                        <div className="px-3 py-2.5 pr-5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                          <div className="relative flex-1 group/note">
                                            <input
                                              type="text"
                                              value={pendingNotes[item.id] !== undefined ? pendingNotes[item.id] : item.notes}
                                              onChange={e =>
                                                setPendingNotes(prev => ({ ...prev, [item.id]: e.target.value }))
                                              }
                                              placeholder="Add notes..."
                                              className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 w-full transition-all focus:bg-white dark:focus:bg-slate-900 pr-8"
                                            />
                                            {pendingNotes[item.id] !== undefined && pendingNotes[item.id] !== item.notes && (
                                              <button
                                                onClick={() => {
                                                  updateRunItem(selectedRun.id, item.id, { notes: pendingNotes[item.id] })
                                                  setPendingNotes(prev => {
                                                    const next = { ...prev }
                                                    delete next[item.id]
                                                    return next
                                                  })
                                                  toast.success('Notes saved')
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-primary/10 rounded-md transition-colors animate-in zoom-in duration-200"
                                                title="Save Notes"
                                              >
                                                <Check size={14} strokeWidth={3} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              {/* Side Detail Panel */}
              <div className={cn(
                "h-full transition-all duration-500 ease-in-out flex flex-col overflow-hidden bg-white dark:bg-surface-card",
                selectedRunItemId 
                  ? "flex-1 opacity-100" 
                  : "flex-[0.00001] opacity-0 pointer-events-none border-transparent"
              )}>
                {(() => {
                  const item = selectedRun.items.find(i => i.id === selectedRunItemId)
                  if (!item) return null
                  return (
                    <div className="flex-1 flex flex-col min-w-0 min-h-0 animate-in fade-in duration-700">
                      {/* Side panel header */}
                      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 text-nowrap">
                            {item.tcId}
                          </span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.title}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedRunItemId(null)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                          {/* Info Header & Status Area */}
                          <div className="grid grid-cols-2 gap-3 items-center">
                            {/* Left: Meta Info */}
                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Section</label>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                  {item.section || 'Unsectioned'}
                                </span>
                              </div>
                              <div className="space-y-0.5 mt-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Case Type</label>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                  {item.caseType || 'Manual'}
                                </span>
                              </div>
                            </div>

                            {/* Right: Status Selection */}
                            <div className="space-y-1 self-start justify-self-end">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none ml-1">Status</label>
                              <div className="relative w-[110px]">
                                <select
                                  value={item.status}
                                  onChange={e =>
                                    updateRunItem(selectedRun.id, item.id, { status: e.target.value as RunItemStatus })
                                  }
                                  className={cn(
                                    'w-full text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-8 transition-all',
                                    STATUS_CONFIG[item.status].bg, 
                                    STATUS_CONFIG[item.status].color, 
                                    STATUS_CONFIG[item.status].border
                                  )}
                                >
                                  {ALL_STATUSES.map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                  ))}
                                </select>
                                <ChevronDown size={12} className={cn('absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60', STATUS_CONFIG[item.status].color)} />
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Notes</label>
                              {pendingNotes[item.id] !== undefined && pendingNotes[item.id] !== item.notes && (
                                <button
                                  onClick={() => {
                                    updateRunItem(selectedRun.id, item.id, { notes: pendingNotes[item.id] })
                                    setPendingNotes(prev => {
                                      const next = { ...prev }
                                      delete next[item.id]
                                      return next
                                    })
                                    toast.success('Notes saved')
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300"
                                >
                                  <Check size={12} strokeWidth={3} />
                                  SAVE CHANGES
                                </button>
                              )}
                            </div>
                            <textarea
                              value={pendingNotes[item.id] !== undefined ? pendingNotes[item.id] : item.notes}
                              onChange={e => setPendingNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Describe results, attach bugs, or add comments..."
                              className="w-full min-h-[100px] p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          <div className="h-px bg-slate-100 dark:bg-slate-800" />

                          {/* Reading Details */}
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preconditions</p>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.preconditions || '—'}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Steps</p>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.steps || '—'}</p>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Result</p>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.expectedResult || '—'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 dark:bg-slate-800" />

                          {/* Activity History */}
                          <div className="space-y-4 pb-4">
                            <div className="flex items-center gap-2">
                              <History size={14} className="text-slate-400" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity History</p>
                            </div>
                            
                            <div className="space-y-4 ml-1.5 border-l border-slate-100 dark:border-slate-800 pl-4 relative">
                              {(item.activityLogs || []).slice().reverse().map((log, idx) => (
                                <div key={log.id} className="relative">
                                  {/* Dot */}
                                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        {log.action === 'CREATED' && 'Added to test run'}
                                        {log.action === 'STATUS_UPDATED' && (
                                          <span className="flex items-center gap-1.5">
                                            Status updated to
                                            <span className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                                              STATUS_CONFIG[log.value as RunItemStatus]?.bg,
                                              STATUS_CONFIG[log.value as RunItemStatus]?.color,
                                              STATUS_CONFIG[log.value as RunItemStatus]?.border
                                            )}>
                                              {STATUS_CONFIG[log.value as RunItemStatus]?.label}
                                            </span>
                                          </span>
                                        )}
                                        {log.action === 'NOTES_UPDATED' && (
                                          <div className="space-y-1">
                                            <span>Execution notes updated:</span>
                                            {log.value && (
                                              <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2 border-l-2 border-slate-200 dark:border-slate-700 pl-2 py-0.5">
                                                "{log.value}"
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </p>
                                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.timestamp).toLocaleString(undefined, { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedItemIds.size > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-0 bg-white dark:bg-surface-card text-slate-900 dark:text-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 p-1.5 min-w-[400px]">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 mr-4">
                    <span className="bg-primary text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm shadow-primary/20">
                      {selectedItemIds.size}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Selected</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Update:</span>
                    <div className="flex gap-1">
                      {ALL_STATUSES.map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusUpdate(status)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all hover:scale-105 active:scale-95 border whitespace-nowrap",
                            STATUS_CONFIG[status].bg,
                            STATUS_CONFIG[status].color,
                            STATUS_CONFIG[status].border,
                            "hover:bg-opacity-80 transition-colors"
                          )}
                        >
                          {STATUS_CONFIG[status].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-3" />

                  <button
                    onClick={() => setSelectedItemIds(new Set())}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-1"
                    title="Clear Selection"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateTestRunModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      {selectedRun && (
        <EditTestRunModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          run={selectedRun}
        />
      )}
    </div>
  )
}

export default TestRunsPage
