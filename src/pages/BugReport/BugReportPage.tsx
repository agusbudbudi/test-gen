import { useState, useRef, useEffect } from 'react'
import { Bug, Sparkles, Copy, Trash2, ChevronDown, Table2, AlignJustify, Upload, Check, ExternalLink, X, Image as ImageIcon, Plus, ClipboardList, Lightbulb, MessageSquarePlus, FileCheck, Info } from 'lucide-react'
import { useBugReport } from '@/hooks/useBugReport'
import { useToast } from '@/hooks/useToast'
import { useJiraExport } from '@/hooks/useJiraExport'
import { useNavigate } from 'react-router-dom'
import ResultTable from '@/components/ResultTable/ResultTable'
import LinkWorkItemModal from '@/components/Modal/LinkWorkItemModal'
import { cn } from '@/lib/utils'

const BugReportPage = () => {
  const [bugDetails, setBugDetails] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showSmartCopyMenu, setShowSmartCopyMenu] = useState(false)
  const [exportedJiraData, setExportedJiraData] = useState<{ key: string; url: string } | null>(null)
  const [copyStatus, setCopyStatus] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    generateReport(bugDetails, uploadedImages)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
  }

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      toast.warning('Some files were skipped. Only PNG/JPG/JPEG under 5MB are allowed.')
    }

    setUploadedImages(prev => {
      const combined = [...prev, ...validFiles]
      if (combined.length > 3) {
        toast.info('Maximum 3 images allowed. Keeping the first 3.')
      }
      return combined.slice(0, 3)
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
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

  const onPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1)
    
    if (imageItems.length > 0) {
      const files = imageItems
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null)
      
      if (files.length > 0) {
        // Prevent pasting the image binary string as text if it's purely an image paste
        // However, if there's also text in the clipboard, we might want to allow it.
        // Usually, image paste from screenshot tools doesn't contain text.
        addFiles(files)
        toast.info(`Added ${files.length} image(s) from clipboard.`)
      }
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Bug Report Generator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Turn messy bug findings into professional, structured QA reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left Column - Inputs */}
        <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/0 to-transparent pointer-events-none rounded-2xl" />
          
          <div className="relative z-10 p-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bug size={20} className={loading ? "animate-pulse text-primary" : "text-primary"} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Bug Details</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Describe the issue and attach evidence</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group/input">
                <textarea
                  placeholder="Explain the bug you found (steps, observations, logs)..."
                  className="w-full h-56 px-5 py-4 bg-slate-50/50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200 resize-none"
                  value={bugDetails}
                  onChange={(e) => setBugDetails(e.target.value)}
                  onPaste={onPaste}
                />
              </div>
              
              {/* Image Upload Zone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <ImageIcon size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attach Screenshots (Max 3)</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group/img w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900/50 animate-in zoom-in-95 duration-200">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {uploadedImages.length < 3 && (
                    <div 
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        ${uploadedImages.length === 0 ? 'flex-1 min-w-[200px]' : 'w-24'} 
                        h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
                        ${isDragging 
                          ? 'border-primary bg-primary/5 scale-[0.98]' 
                          : 'border-slate-200 dark:border-slate-800/50 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      `}
                    >
                      {uploadedImages.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={20} className={isDragging ? 'text-primary' : 'text-slate-300'} />
                          <p className={`text-xs text-center px-4 ${isDragging ? 'text-primary font-medium' : 'text-slate-400'}`}>
                            {isDragging ? 'Drop images here' : 'Drag & drop screenshots or click to upload'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Plus size={20} className="text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-400">Add More</span>
                        </>
                      )}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg"
                        multiple
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-border-brand/40 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setBugDetails('')
                  setUploadedImages([])
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-red-50 dark:bg-slate-800/50 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-500 rounded-xl transition-all text-sm font-bold border border-slate-200 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-900/50"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !bugDetails.trim()}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                )}
                {loading ? 'Analyzing Bug...' : 'Generate Bug Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Pro Tips</p>
          
          <div className="space-y-3">
            {[
              {
                icon: Lightbulb,
                title: 'Be Descriptive',
                desc: 'Include steps to reproduce, expected vs actual behavior, and environment details.',
                color: 'text-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-900/20'
              },
              {
                icon: ImageIcon,
                title: 'Visual Evidence',
                desc: 'Upload up to 3 screenshots. AI will analyze the UI and error messages visually.',
                color: 'text-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-900/20'
              },
              {
                icon: FileCheck,
                title: 'Smart Export',
                desc: 'Use Smart Copy to paste formatted tables directly into Jira descriptions.',
                color: 'text-indigo-500',
                bg: 'bg-indigo-50 dark:bg-indigo-900/20'
              }
            ].map((card, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", card.bg, card.color)}>
                    <card.icon size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{card.title}</h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}

            <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Jira Ready</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The generated report follows the standard Jira Bug template including <strong>Priority</strong>, <strong>Environment</strong>, and <strong>Steps</strong>.
              </p>
              <button
                onClick={() => navigate('/settings?tab=jira')}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 w-fit px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-500/10 transition-colors"
              >
                Configure Jira
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Result Area */}
      {bugData && (
        <div className="space-y-4 pt-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-primary rounded-full" />
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                Generated Bug Report
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {/* Smart Copy with dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowSmartCopyMenu(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Sparkles size={14} />
                    Smart Copy
                    <ChevronDown size={12} className={cn("transition-transform", showSmartCopyMenu && "rotate-180")} />
                  </button>

                  {showSmartCopyMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paste to Jira</p>
                      </div>
                      <button
                        onClick={() => performSmartCopy(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                      >
                        <Table2 size={16} className="text-indigo-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">With Header</div>
                          <div className="text-xs text-slate-400 text-nowrap">Includes column names</div>
                        </div>
                      </button>
                      <button
                        onClick={() => performSmartCopy(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                      >
                        <AlignJustify size={16} className="text-indigo-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">Without Header</div>
                          <div className="text-xs text-slate-400 text-nowrap">Data rows only</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />

                <button
                  onClick={handleExportClick}
                  disabled={exporting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {exporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <img src="/assets/icons/jira-icon.png" alt="Jira" className="w-3.5 h-3.5 object-contain" />
                  )}
                  {exporting ? `Exporting...` : 'Export to Jira'}
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {exportedJiraData && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
                >
                  {copyStatus ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copyStatus ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => setExportedJiraData(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-border-brand bg-white dark:bg-surface-card">
            <ResultTable 
              headers={bugData[0]} 
              rows={bugData.slice(1)} 
            />
          </div>
        </div>
      )}

      {loading && !bugData && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4 animate-in fade-in duration-500">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="animate-pulse font-medium">AI is crafting your bug report...</p>
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
