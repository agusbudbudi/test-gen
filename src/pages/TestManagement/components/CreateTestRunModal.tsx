import React, { useState, useMemo } from 'react'
import Modal from '@/components/Modal/Modal'
import { useTestCaseStore, Folder, TestCase } from '@/stores/testCaseStore'
import { ChevronRight, ChevronDown, Folder as FolderIcon, FileText, Check, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateTestRunModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateTestRunModal: React.FC<CreateTestRunModalProps> = ({ isOpen, onClose }) => {
  const { folders, testCases, addTestRun } = useTestCaseStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTcIds, setSelectedTcIds] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedTcIds.size === 0) return
    addTestRun(name.trim(), description.trim(), Array.from(selectedTcIds))
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setSelectedTcIds(new Set())
    setExpandedFolders(new Set())
    onClose()
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(folderId) ? next.delete(folderId) : next.add(folderId)
      return next
    })
  }

  const toggleTc = (tcId: string) => {
    setSelectedTcIds(prev => {
      const next = new Set(prev)
      next.has(tcId) ? next.delete(tcId) : next.add(tcId)
      return next
    })
  }

  const isParentMatch = (currentParent: string | null | undefined, targetParent: string | null | undefined) => {
    return (currentParent || null) === (targetParent || null)
  }

  const getTcsInFolder = (folderId: string | null): TestCase[] => {
    const direct = testCases.filter(tc => isParentMatch(tc.folderId, folderId))
    const children = folders.filter(f => isParentMatch(f.parentId, folderId))
    return [...direct, ...children.flatMap(f => getTcsInFolder(f.id))]
  }

  const toggleAllInFolder = (folderId: string | null) => {
    const all = getTcsInFolder(folderId)
    const allSelected = all.every(tc => selectedTcIds.has(tc.id))
    setSelectedTcIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        all.forEach(tc => next.delete(tc.id))
      } else {
        all.forEach(tc => next.add(tc.id))
      }
      return next
    })
  }

  const getFolderCheckState = (folderId: string | null): 'all' | 'some' | 'none' => {
    const all = getTcsInFolder(folderId)
    if (all.length === 0) return 'none'
    const selected = all.filter(tc => selectedTcIds.has(tc.id)).length
    if (selected === all.length) return 'all'
    if (selected > 0) return 'some'
    return 'none'
  }

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const childFolders = folders.filter(f => isParentMatch(f.parentId, parentId))
    const childFiles = testCases.filter(tc => isParentMatch(tc.folderId, parentId))

    if (childFolders.length === 0 && childFiles.length === 0) return null

    return (
      <div>
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id)
          const checkState = getFolderCheckState(folder.id)
          const hasChildren =
            folders.some(f => f.parentId === folder.id) ||
            testCases.some(tc => tc.folderId === folder.id)

          return (
            <div key={folder.id}>
              <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer group"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                {/* Indeterminate / folder checkbox */}
                <button
                  type="button"
                  onClick={() => toggleAllInFolder(folder.id)}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    checkState === 'all'
                      ? 'bg-primary border-primary text-white'
                      : checkState === 'some'
                      ? 'bg-primary/30 border-primary'
                      : 'border-slate-300 dark:border-slate-600'
                  )}
                >
                  {checkState === 'all' && <Check size={10} />}
                  {checkState === 'some' && <div className="w-2 h-0.5 bg-primary rounded" />}
                </button>

                {/* Expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  {hasChildren ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  ) : (
                    <div className="w-[14px]" />
                  )}
                </button>

                <FolderIcon size={15} className="text-amber-500/80 shrink-0" />
                <span
                  className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1"
                  onClick={() => toggleFolder(folder.id)}
                >
                  {folder.name}
                </span>
              </div>

              {isExpanded && renderTree(folder.id, depth + 1)}
            </div>
          )
        })}

        {childFiles.map(tc => (
          <div
            key={tc.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            onClick={() => toggleTc(tc.id)}
          >
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleTc(tc.id) }}
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                selectedTcIds.has(tc.id)
                  ? 'bg-primary border-primary text-white'
                  : 'border-slate-300 dark:border-slate-600'
              )}
            >
              {selectedTcIds.has(tc.id) && <Check size={10} />}
            </button>
            <FileText size={14} className="text-blue-500/70 shrink-0" />
            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 shrink-0">
              {tc.tcId}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{tc.title}</span>
          </div>
        ))}
      </div>
    )
  }

  const totalTcs = testCases.length
  const allSelected = totalTcs > 0 && selectedTcIds.size === totalTcs
  const someSelected = selectedTcIds.size > 0 && !allSelected
  const rootCheckState = getFolderCheckState(null)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Test Run" maxWidth="lg" noPadding>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* Run Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Run Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
              placeholder="e.g. Sprint 12 Regression"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* TC Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Test Cases <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {selectedTcIds.size} / {totalTcs} selected
                </span>
                <button
                  type="button"
                  onClick={() => toggleAllInFolder(null)}
                  className="text-xs text-primary hover:underline"
                >
                  {rootCheckState === 'all' ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {totalTcs === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50/50 dark:bg-slate-800/20">
                <div className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-xl mb-3">
                  <ClipboardList className="text-slate-400" size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No master test cases found</p>
                <p className="text-xs text-slate-500 mt-1 px-10">You need to create test cases in the <strong>Test Cases</strong> tab before you can create a test run.</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto max-h-64 bg-white dark:bg-slate-900 p-1 scrollbar-thin">
                {renderTree(null) || (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-slate-400 italic">No root items found.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Please ensure your test cases are in valid folders.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || selectedTcIds.size === 0}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Run
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateTestRunModal
