import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  Sparkles, 
  History as HistoryIcon, 
  FileSpreadsheet, 
  Copy, 
  Lightbulb, 
  ClipboardPaste,
  MessageSquarePlus,
  FileCheck, 
  Beaker,
  Bot,
  FolderPlus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGenerateTestCase } from '@/hooks/useGenerateTestCase'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useResultStore } from '@/stores/resultStore'
import { useTestCaseStore } from '@/stores/testCaseStore'
import { useToast } from '@/hooks/useToast'
import { exportToExcel } from '@/lib/exportExcel'
import ResultTable from '@/components/ResultTable/ResultTable'
import PromptInstructionsModal from '@/components/Modal/PromptInstructionsModal'
import HowToUseModal from '@/components/Modal/HowToUseModal'
import AddToFolderModal from './components/AddToFolderModal'
import { useJiraImport } from '@/hooks/useJiraImport'
import { cn } from '@/lib/utils'

const Badge = ({ icon: Icon, title, description, onClick, colorClass, bgClass }: any) => (
  <button 
    onClick={onClick}
    className="flex items-start gap-4 p-4 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl hover:border-primary dark:hover:border-primary transition-all text-left group hover-scale cursor-pointer"
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 group-hover:bg-primary group-hover:text-white",
      bgClass,
      colorClass
    )}>
      <Icon size={20} />
    </div>
    <div className="space-y-0.5">
      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{description}</p>
    </div>
  </button>
)

const GeneratePage = () => {
  const [userStory, setUserStory] = useState('')
  const [promptDetails, setPromptDetails] = useState('')
  const [customCount, setCustomCount] = useState<number | ''>('')
  const [tags, setTags] = useState('')
  const [inputMode, setInputMode] = useState<'manual' | 'jira'>('manual')
  const [jiraUrl, setJiraUrlInput] = useState('')
  const navigate = useNavigate()
  
  const { 
    setPromptModalOpen, 
    setHowToUseModalOpen, 
    setTemplateModalOpen,
    testCaseTemplates, 
    defaultTestCaseCount, 
    selectedModel,
    selectedTemplateId,
  } = useUIStore()
  const { generate, cancel, loading, resultData, setResultData } = useGenerateTestCase()
  const { importFromJira, importing } = useJiraImport()
  const addHistory = useHistoryStore((state) => state.addEntry)
  const addTestCase = useTestCaseStore((state) => state.addTestCase)
  const toast = useToast()
  const isInitialMount = useRef(true)
  const lastAppliedTemplateId = useRef<string | null>(null)
  const [isAddToFolderModalOpen, setIsAddToFolderModalOpen] = useState(false)

  const cleanHtml = (text: any) => {
    if (!text) return ''
    return String(text)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  const handleSaveToFolder = (folderId: string) => {
    if (!resultData || resultData.length <= 1) return

    const rows = resultData.slice(1) // Exclude headers
    const headers = resultData[0]

    // Map headers to indexes for resilient mapping
    const getIdx = (headerName: string) => headers.indexOf(headerName)
    const sectionIdx = getIdx("Section")
    const typeIdx = getIdx("Case Type")
    const titleIdx = getIdx("Title")
    const preconIdx = getIdx("Precondition")
    const stepIdx = getIdx("Step")
    const expectIdx = getIdx("Expected Result")

    rows.forEach(row => {
      addTestCase({
        folderId,
        section: cleanHtml(row[sectionIdx]),
        caseType: cleanHtml(row[typeIdx]),
        title: cleanHtml(row[titleIdx]),
        preconditions: cleanHtml(row[preconIdx]),
        steps: cleanHtml(row[stepIdx]),
        expectedResult: cleanHtml(row[expectIdx]),
        tags: [tags, 'ai-generated'].filter(t => t.trim() !== '').join(', ')
      })
    })

    toast.success(`Successfully added ${rows.length} test cases to folder.`)
  }

  const handleApplyTemplate = () => {
    setTemplateModalOpen(true)
  }

  // Effect to apply template when selectedTemplateId changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Only apply if the ID has actually changed from what was last applied
    if (selectedTemplateId === lastAppliedTemplateId.current) return

    const template = testCaseTemplates.find(t => t.id === selectedTemplateId)
    if (template) {
      setUserStory(`**User Story**:
[Masukkan user story di sini]`)
      setPromptDetails(`**Context / Focus**:
${template.prompt}

**Preconditions**:
- [Masukkan precondition di sini]

**Acceptance Criteria**:
- [Masukkan acceptance criteria di sini]`)
      
      toast.info(`Template '${template.name}' applied.`)
      lastAppliedTemplateId.current = selectedTemplateId
    }
  }, [selectedTemplateId, testCaseTemplates, toast])

  const handleGenerate = async () => {
    let finalStory = userStory
    let finalPrompt = promptDetails

    if (inputMode === 'jira') {
      if (!jiraUrl.trim()) {
        toast.warning('Please enter a Jira URL first.')
        return
      }
      const data = await importFromJira(jiraUrl)
      if (data) {
        finalStory = `**User Story (${data.summary})**:
${data.summary}

**Acceptance Criteria / Context**:
${data.description}`
        finalPrompt = `Analyze the provided Jira ticket details and generate test cases covering all edge cases, positive paths, and negative paths.`
      } else {
        return // Failed to fetch
      }
    }

    generate(finalStory, `${finalPrompt}${tags ? `\n\n**Tags/Labels**: ${tags}` : ''}`, {
      count: customCount === '' ? defaultTestCaseCount : customCount,
      model: selectedModel
    })
  }

  const handleAddToHistory = () => {
    if (!resultData) {
      toast.warning('No test case result available to save!')
      return
    }
    addHistory({
      type: 'result',
      content: resultData.slice(1) // Remove headers as they are static
    })
    toast.success('Test case result added to history.')
  }

  const handleReviewGenerated = () => {
    if (!resultData || resultData.length <= 1) {
      toast.warning('No test cases to review!')
      return
    }

    // Convert to TSV (excluding headers)
    const tsv = resultData.slice(1)
      .map(row => 
        row.map(cell => {
          const cellStr = String(cell || '')
          return cellStr
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
        }).join('\t')
      )
      .join('\n')

    useResultStore.getState().setPendingReviewInput(tsv)
    navigate('/review')
  }

  const handleExport = () => {
    if (!resultData) {
      toast.warning('No data to export!')
      return
    }
    try {
      exportToExcel(resultData)
      toast.success('Exported to Excel successfully!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleCopy = () => {
    if (!resultData || resultData.length <= 1) {
      toast.warning('No test cases to copy!')
      return
    }
    
    // Convert to TSV string for easy pasting into Sheets/Excel (excluding headers)
    const tsv = resultData.slice(1)
      .map(row => 
        row.map(cell => {
          const cellStr = String(cell || '')
          const cleaned = cellStr
            .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newline
            .replace(/<[^>]*>/g, '')      // Strip other tags
            .replace(/"/g, '""')          // Escape quotes for TSV
          return `"${cleaned}"`
        }).join('\t')
      )
      .join('\n')

    navigator.clipboard.writeText(tsv)
      .then(() => toast.success('Test cases copied to clipboard!'))
      .catch(() => toast.error('Failed to copy test cases.'))
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Generate Test Case
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate comprehensive test cases from your user stories instantly.
          </p>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

        {/* ── LEFT COLUMN: Main Input Area ── */}
        <div className="space-y-0 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-2xl overflow-hidden">

          {/* Input Mode Tabs */}
          <div className="flex gap-1 px-2 pt-1 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setInputMode('manual')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
                inputMode === 'manual'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <ClipboardPaste size={14} />
              Manual Input (AC)
            </button>
            <button
              onClick={() => setInputMode('jira')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
                inputMode === 'jira'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <img src="/assets/icons/jira-icon.png" className="w-4 h-4 object-contain" alt="Jira" />
              Jira URL
              <span className="ml-1 px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500 text-white dark:bg-indigo-400 dark:text-indigo-950 rounded-md shadow-indigo-500/20">NEW</span>
            </button>
          </div>

          {/* Input Fields */}
          <div className="p-5">
            {inputMode === 'manual' ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">User Story</label>
                  <textarea
                    placeholder="As a [user], I want to [action] so that [benefit]..."
                    className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200 resize-none"
                    value={userStory}
                    onChange={(e) => setUserStory(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Acceptance Criteria / Prompt Details</label>
                  <textarea
                    placeholder="Enter Preconditions, Acceptance Criteria, and any other context..."
                    className="w-full h-52 px-4 py-3 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200 resize-none"
                    value={promptDetails}
                    onChange={(e) => setPromptDetails(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              // Gradient wrapper: starts with a vibrant highlight, fades to transparent downward
              <div className="relative rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
                {/* Vibrant Gradient overlay - Lighter & More Highlighted */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-blue-500/5 to-transparent pointer-events-none rounded-2xl" />
                
                {/* Content Area */}
                <div className="relative z-10 space-y-4 p-4 pb-6">
                  {/* Premium AI header */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Bot size={18} className={cn(importing ? 'animate-pulse text-indigo-600' : 'text-indigo-600 dark:text-indigo-400')} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">AI-Powered Jira Import</p>
                      <p className="text-[11px] text-slate-500 dark:text-indigo-300/80 leading-snug">Paste a Jira URL — AI generates test cases automatically</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-600/70 dark:text-indigo-300/70 uppercase tracking-wider">Jira Ticket URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://yourdomain.atlassian.net/browse/PROJ-123"
                        className="w-full pl-4 pr-12 py-3.5 bg-white/80 dark:bg-surface-dark border-3 border-indigo-100 dark:border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                        value={jiraUrl}
                        onChange={(e) => setJiraUrlInput(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500/60">
                        <Sparkles size={16} className={cn(importing ? 'animate-pulse text-indigo-600' : '')} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                    <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Jira Integration must be configured in <strong className="text-slate-800 dark:text-slate-200">Settings</strong> for this feature to work.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons — inside card, at the bottom */}
          <div className={cn(
            "px-5 pb-5 space-y-3",
            inputMode === 'jira' && "pt-2"
          )}>
            {/* Compact Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-400 shrink-0">Count</span>
                <input
                  type="number"
                  min="1"
                  placeholder={`${defaultTestCaseCount}`}
                  value={customCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCustomCount('');
                      return;
                    }
                    const num = parseInt(val);
                    if (num >= 1) {
                      setCustomCount(num);
                    }
                  }}
                  className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-400 shrink-0">Tags</span>
                <input
                  type="text"
                  placeholder="Sprint-12, Priority-High"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all dark:text-slate-200"
                />
              </div>
            </div>

            {/* Primary CTA row */}
            <div className="flex gap-2">
              {resultData && (
                <button
                  onClick={handleReviewGenerated}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold text-sm rounded-xl transition-all shrink-0"
                >
                  <Bot size={16} />
                  Review with AI
                </button>
              )}
              {loading ? (
                <button
                  onClick={cancel}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cancel Generation
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={importing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  {importing ? 'Fetching from Jira...' : 'Generate Test Cases'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Helper Cards ── */}
        <div className="space-y-3">
          {/* Helper Cards */}
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Quick Actions</p>

          {[
            {
              icon: ClipboardPaste,
              title: 'Use Template',
              desc: 'Fill inputs with a predefined template.',
              onClick: handleApplyTemplate,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
            },
            {
              icon: MessageSquarePlus,
              title: 'Prompt Instructions',
              desc: 'Manage reusable global prompt instructions.',
              onClick: () => setPromptModalOpen(true),
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            },
            {
              icon: Lightbulb,
              title: 'How To Use',
              desc: 'Step-by-step guide for this tool.',
              onClick: () => setHowToUseModalOpen(true),
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl hover:border-primary dark:hover:border-primary transition-all text-left group"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:bg-primary group-hover:text-white", item.bg, item.color)}>
                <item.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-snug line-clamp-1 mt-0.5">{item.desc}</p>
              </div>
      </button>
    ))}

    {/* Model Switcher Banner - Subtle Highlight Style */}
    <button
      onClick={() => navigate('/settings?tab=general')}
      className="w-full mt-2 relative overflow-hidden group rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-4 text-left transition-all hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/10 active:scale-[0.98]"
    >
      <div className="absolute -right-2 -top-2 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
        <Sparkles size={80} />
      </div>
      
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
            <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-300/70 uppercase tracking-widest">Model Strategy</span>
        </div>
        
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">Switch AI Models</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Try switching between GPT-4o, o1, or other models for more accurate test cases.
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 w-fit px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-500/10 transition-colors">
          Open Settings
          <Sparkles size={10} />
        </div>
      </div>
    </button>

        </div>
      </div>

      {/* ── Result Area: Full Width ── */}
      {resultData && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          {/* Result header + action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-primary rounded-full" />
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                Generated Results
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={handleAddToHistory}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="Add to History"
                >
                  <HistoryIcon size={14} />
                  History
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                <button
                  onClick={handleExport}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={14} />
                  Export
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="Copy Test Cases"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                <button
                  onClick={() => setIsAddToFolderModalOpen(true)}
                  className="p-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="Add to Folder"
                >
                  <FolderPlus size={14} />
                  Add to Folder
                </button>
              </div>
            </div>
          </div>

          <ResultTable
            headers={resultData[0]}
            rows={resultData.slice(1)}
          />
        </div>
      )}

      <AddToFolderModal
        isOpen={isAddToFolderModalOpen}
        onClose={() => setIsAddToFolderModalOpen(false)}
        onSave={handleSaveToFolder}
      />
    </div>
  )
}

export default GeneratePage
