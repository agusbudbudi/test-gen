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
  const { generate, loading, resultData, setResultData } = useGenerateTestCase()
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
        expectedResult: cleanHtml(row[expectIdx])
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

  const handleGenerate = () => {
    generate(userStory, `${promptDetails}${tags ? `\n\n**Tags/Labels**: ${tags}` : ''}`, {
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
    
    // Convert to TSV string for easy pasting into Sheets/Excel
    const tsv = resultData
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

      {/* Action Badges & Advanced Controls */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Badge 
            icon={ClipboardPaste}
            title="Use Template"
            description="Gunakan template yang tersedia untuk mengisi User Story dan Prompt."
            onClick={handleApplyTemplate}
            bgClass="bg-blue-50 dark:bg-blue-900/20"
            colorClass="text-blue-600 dark:text-blue-400"
          />
          <Badge 
            icon={MessageSquarePlus}
            title="Prompt Instructions"
            description="Simpan instruksi prompt reusable untuk digabung saat generate."
            onClick={() => setPromptModalOpen(true)}
            bgClass="bg-indigo-50 dark:bg-indigo-900/20"
            colorClass="text-indigo-600 dark:text-indigo-400"
          />
          <Badge 
            icon={Lightbulb}
            title="How To Use"
            description="Ikuti langkah-langkah berikut untuk menggunakan AI Test Case Generator."
            onClick={() => setHowToUseModalOpen(true)}
            bgClass="bg-amber-50 dark:bg-amber-900/20"
            colorClass="text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <textarea
            placeholder="Enter User Story..."
            className="w-full h-24 px-5 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200"
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
          />
          <textarea
            placeholder="Enter detailed prompt containing Preconditions and Acceptance Criteria..."
            className="w-full h-48 px-5 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200"
            value={promptDetails}
            onChange={(e) => setPromptDetails(e.target.value)}
          />
        </div>

        {/* Custom Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-border-brand">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Case Count (Optional)</label>
            <input 
              type="number"
              placeholder={`Default: ${defaultTestCaseCount}`}
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all dark:text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Tags / Labels</label>
            <input 
              type="text"
              placeholder="e.g. Sprint-12, Priority-High"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all dark:text-slate-200"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <button 
              onClick={handleAddToHistory}
              disabled={!resultData}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              <HistoryIcon size={18} />
              Add to History
            </button>
            <button 
              onClick={handleExport}
              disabled={!resultData}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              <FileSpreadsheet size={18} />
              Export to Excel
            </button>
            <button 
              onClick={handleCopy}
              disabled={!resultData}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              <Copy size={18} />
              Copy Test Case
            </button>
            <button 
              onClick={() => setIsAddToFolderModalOpen(true)}
              disabled={!resultData}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              <FolderPlus size={18} />
              Add to Folder
            </button>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleReviewGenerated}
              disabled={!resultData}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-card border-1 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl transition-all hover:bg-indigo-50 dark:hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover-scale group"
            >
              <Bot size={18} />
              Review Test Case
            </button>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover-scale"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles size={20} />
              )}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Area */}
      {resultData && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs font-bold uppercase tracking-widest">Generated Results</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
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
