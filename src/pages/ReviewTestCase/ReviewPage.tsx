import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Copy, Trash2, Upload, FileText, CheckCircle2, AlertCircle, Lightbulb, FolderPlus, Beaker } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useReviewTestCase } from '@/hooks/useReviewTestCase'
import { useToast } from '@/hooks/useToast'
import { parseFile } from '@/lib/fileParser'
import { cn } from '@/lib/utils'
import ResultTable from '@/components/ResultTable/ResultTable'
import { useResultStore } from '@/stores/resultStore'
import { useTestCaseStore } from '@/stores/testCaseStore'
import { useEffect } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import AddToFolderModal from '@/pages/GenerateTestCase/components/AddToFolderModal'

const ReviewPage = () => {
  const [testCaseInput, setTestCaseInput] = useState('')
  const [isAddToFolderModalOpen, setIsAddToFolderModalOpen] = useState(false)
  const { review, loading, reviewResult } = useReviewTestCase()
  const addHistory = useHistoryStore((state) => state.addEntry) 
  const addTestCase = useTestCaseStore((state) => state.addTestCase)
  const toast = useToast()

  const pendingReviewInput = useResultStore(state => state.pendingReviewInput)
  const setPendingReviewInput = useResultStore(state => state.setPendingReviewInput)

  useEffect(() => {
    if (pendingReviewInput) {
      setTestCaseInput(pendingReviewInput)
      review(pendingReviewInput)
      setPendingReviewInput(null)
    }
  }, [pendingReviewInput, review, setPendingReviewInput])

  const handleReview = () => {
    review(testCaseInput)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await parseFile(file)
      setTestCaseInput(content)
      toast.success(`File "${file.name}" loaded successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file')
    }
  }

  const handleSaveToHistory = () => {
    if (!reviewResult) return
    addHistory({
      type: 'review',
      content: {
        summary: reviewResult.summary,
        strengths: reviewResult.strengths,
        suggestions: reviewResult.suggestions,
        improvedVersion: JSON.stringify(reviewResult.improvedVersion)
      }
    })
    toast.success('Review result saved to history!')
  }



  const handleCopyImproved = () => {
    if (!reviewResult?.improvedVersion || reviewResult.improvedVersion.length === 0) {
      toast.warning('No improved test cases to copy!')
      return
    }

    const headers = ['No', 'Section', 'Case Type', 'Title', 'Precondition', 'Step', 'Expected Result']
    
    // Map data to TSV format, skipping index 0 (Status)
    const tsv = [
      headers.join('\t'),
      ...reviewResult.improvedVersion.map(row => [
        String(row.No || ''),
        String(row.Section || ''),
        String(row['Case Type'] || ''),
        String(row.Title || ''),
        String(row.Precondition || ''),
        String(row.Step || ''),
        String(row['Expected Result'] || '')
      ].map(cell => {
        // Basic cleanup similar to GeneratePage
        const cleaned = cell
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/"/g, '""')
        return `"${cleaned}"`
      }).join('\t'))
    ].join('\n')

    navigator.clipboard.writeText(tsv)
      .then(() => toast.success('Improved test cases copied (ignoring Status)!'))
      .catch(() => toast.error('Failed to copy to clipboard.'))
  }

  const cleanHtml = (text: any) => {
    if (!text) return ''
    return String(text)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  const handleSaveToFolder = (folderId: string) => {
    if (!reviewResult?.improvedVersion || reviewResult.improvedVersion.length === 0) return

    reviewResult.improvedVersion.forEach(row => {
      addTestCase({
        folderId,
        section: cleanHtml(row.Section),
        caseType: cleanHtml(row['Case Type']),
        title: cleanHtml(row.Title),
        preconditions: cleanHtml(row.Precondition),
        steps: cleanHtml(row.Step),
        expectedResult: cleanHtml(row['Expected Result'])
      })
    })

    toast.success(`Successfully added ${reviewResult.improvedVersion.length} test cases to folder.`)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          AI Test Case Reviewer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Paste your test cases below for a detailed AI-driven review.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          placeholder="Paste the test cases you want AI to review..."
          className="w-full h-64 px-5 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed dark:text-slate-200"
          value={testCaseInput}
          onChange={(e) => setTestCaseInput(e.target.value)}
        />

        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => setTestCaseInput('')}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 transition-colors text-sm font-medium hover-scale"
            >
              <Trash2 size={16} />
              Clear Input
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer hover-scale">
              <Upload size={16} />
              Upload File (Excel/CSV)
              <input type="file" accept=".xlsx,.xls,.csv,.tsv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <button
            onClick={handleReview}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-all shadow-[0_8px_16px_-4px_rgba(var(--color-primary-rgb),0.2)] disabled:opacity-70 disabled:cursor-not-allowed hover-scale"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Bot size={20} />
            )}
            {loading ? 'Reviewing...' : 'Review Test Case'}
          </button>
        </div>
      </div>

      {reviewResult && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Top: Full-Width Summary & Findings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">Review Summary</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "{reviewResult.summary}"
            </p>
            
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" /> Strengths
                  </h4>
                  <ul className="space-y-1">
                    {reviewResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Lightbulb size={14} className="text-blue-500" /> Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {reviewResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-500" /> Missing Cases
                  </h4>
                  <ul className="space-y-1">
                    {reviewResult.missingCases.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Full-Width Improved Table with Integrated Actions */}
          {reviewResult.improvedVersion && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-primary rounded-full" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                    Missing & Improved Test Cases
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                      onClick={handleSaveToHistory}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                      title="Save to History"
                    >
                      <HistoryIcon size={14} />
                      Save
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                    <button 
                      onClick={handleCopyImproved}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                      title="Copy Improved Test Cases"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                    <button 
                      onClick={() => setIsAddToFolderModalOpen(true)}
                      className="p-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                      title="Add to Folder"
                    >
                      <FolderPlus size={14} />
                      Add to Folder
                    </button>
                  </div>
                </div>
              </div>
              
              <ResultTable 
                headers={['Status', 'No', 'Section', 'Case Type', 'Title', 'Precondition', 'Step', 'Expected Result']} 
                rows={reviewResult.improvedVersion.map(row => [
                  String(row.Status || ''),
                  String(row.No || ''),
                  String(row.Section || ''),
                  String(row['Case Type'] || ''),
                  String(row.Title || ''),
                  String(row.Precondition || ''),
                  String(row.Step || ''),
                  String(row['Expected Result'] || '')
                ])} 
              />
            </div>
          )}
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

export default ReviewPage
