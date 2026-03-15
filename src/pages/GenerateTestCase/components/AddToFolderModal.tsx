import React, { useState } from 'react'
import Modal from '@/components/Modal/Modal'
import { useTestCaseStore, Folder } from '@/stores/testCaseStore'
import { Folder as FolderIcon, Search, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddToFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (folderId: string) => void
}

const AddToFolderModal: React.FC<AddToFolderModalProps> = ({ isOpen, onClose, onSave }) => {
  const { folders } = useTestCaseStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [hasInitializedCollapse, setHasInitializedCollapse] = useState(false)

  React.useEffect(() => {
    if (isOpen && folders.length > 0 && !hasInitializedCollapse) {
      setCollapsedFolders(new Set(folders.map(f => f.id)))
      setHasInitializedCollapse(true)
    }
  }, [isOpen, folders, hasInitializedCollapse])

  React.useEffect(() => {
    if (!isOpen) {
      setHasInitializedCollapse(false)
      setSearchQuery('')
      setSelectedId(null)
    }
  }, [isOpen])

  const toggleFolderCollapse = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = () => {
    if (selectedId) {
      onSave(selectedId)
      onClose()
      setSelectedId(null)
    }
  }

  const renderFolderItems = (parentId: string | null = null, depth = 0) => {
    const currentFolders = filteredFolders.filter(f => f.parentId === parentId)
    
    if (currentFolders.length === 0) return null

    return (
      <div className="space-y-1">
        {currentFolders.map(folder => {
          const isCollapsed = collapsedFolders.has(folder.id) && !searchQuery.trim()
          const hasChildren = filteredFolders.some(f => f.parentId === folder.id)

          return (
            <div key={folder.id}>
              <button
                onClick={() => {
                  setSelectedId(folder.id)
                  if (isCollapsed) {
                    toggleFolderCollapse({ stopPropagation: () => {} } as React.MouseEvent, folder.id)
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-sm group",
                  selectedId === folder.id 
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span 
                    onClick={(e) => toggleFolderCollapse(e, folder.id)}
                    className={cn(
                      "p-0.5 rounded transition-colors flex-shrink-0 cursor-pointer",
                      selectedId === folder.id ? "hover:bg-primary/20" : "hover:bg-slate-200 dark:hover:bg-slate-700",
                      searchQuery.trim() ? "opacity-30 pointer-events-none" : ""
                    )}
                  >
                    {hasChildren ? (
                      isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <div className="w-[14px]" />
                    )}
                  </span>
                  <FolderIcon size={16} className={cn(selectedId === folder.id ? "text-primary" : "text-amber-500/70 shrink-0")} />
                  <span className="truncate">{folder.name}</span>
                  {folder.tag && (
                    <div className="flex items-center gap-1">
                      {folder.tag.split(',').filter(t => t.trim() !== '').map((tagStr, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-normal shrink-0">
                          {tagStr.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {selectedId === folder.id && <Check size={14} className="text-primary shrink-0" />}
              </button>
              {!isCollapsed && renderFolderItems(folder.id, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Destination Folder" maxWidth="md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto scrollbar-thin p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
          {folders.length > 0 ? (
            renderFolderItems(null)
          ) : (
            <div className="p-8 text-center text-slate-400">
              <FolderIcon size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No folders created yet.</p>
              <p className="text-xs mt-1">Go to Test Management to create one.</p>
            </div>
          )}
          {folders.length > 0 && filteredFolders.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              No matching folders found.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedId}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Folder
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AddToFolderModal
