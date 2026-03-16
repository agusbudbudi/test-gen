import React, { useState } from 'react'
import { Plus, FolderPlus, FilePlus, Check, ChevronRight, ChevronDown, ChevronLeft, Folder, FileText, Search, MoreVertical, Trash2, Edit2, FolderTree, ArrowLeft, Play, ClipboardList, Beaker } from 'lucide-react'
import { useTestCaseStore, Folder as FolderType, TestCase } from '@/stores/testCaseStore'
import { cn } from '@/lib/utils'
import AddFolderModal from './components/AddFolderModal'
import AddFileModal from '@/pages/TestManagement/components/AddFileModal'
import TestRunsPage from './components/TestRunsPage'
import { useToast } from '@/hooks/useToast'

const TestManagementPage = () => {
  const { 
    folders, 
    testCases, 
    selectedFolderId, 
    selectedFileId,
    setSelectedFolder,
    setSelectedFile,
    deleteFolder,
    deleteTestCase,
    moveFolder,
    moveTestCase
  } = useTestCaseStore()

  const [isAddFolderModalOpen, setAddFolderModalOpen] = useState(false)
  const [isAddFileModalOpen, setAddFileModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [searchExpandedFolders, setSearchExpandedFolders] = useState<Set<string>>(new Set())
  const [sidebarWidth, setSidebarWidth] = useState(288)
  const isResizing = React.useRef(false)
  const [hasInitializedCollapse, setHasInitializedCollapse] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'folder' | 'file' } | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'testcases' | 'testruns'>('testruns')

  React.useEffect(() => {
    if (folders.length > 0 && !hasInitializedCollapse) {
      setCollapsedFolders(new Set(folders.map(f => f.id)))
      setHasInitializedCollapse(true)
    }
  }, [folders, hasInitializedCollapse])

  const toggleFolderCollapse = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Filter folders and files based on search
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredTestCases = testCases.filter(tc => tc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const selectedFolder = folders.find(f => f.id === selectedFolderId)
  const selectedFile = testCases.find(tc => tc.id === selectedFileId)

  // Sub-items of the selected folder
  const folderContents = [
    ...folders.filter(f => f.parentId === selectedFolderId),
    ...testCases.filter(tc => tc.folderId === selectedFolderId)
  ]

  const [editForm, setEditForm] = useState<Partial<TestCase>>({})
  const [isFolderEditMode, setIsFolderEditMode] = useState(false)
  const [editFolderForm, setEditFolderForm] = useState<Partial<FolderType>>({})
  
  const { updateTestCase, updateFolder } = useTestCaseStore()
  const toast = useToast()

  // Initialize edit form when selected file changes
  React.useEffect(() => {
    if (selectedFile) {
      setEditForm(selectedFile)
      
      // Auto-expand parent folders in the tree view
      if (selectedFile.folderId) {
        setCollapsedFolders(prev => {
          const next = new Set(prev)
          let currentId: string | null = selectedFile.folderId
          while (currentId) {
            next.delete(currentId)
            const folder = folders.find(f => f.id === currentId)
            currentId = folder?.parentId || null
          }
          return next
        })
      }
    }
  }, [selectedFileId, folders])

  // Initialize folder edit form when selected folder changes
  React.useEffect(() => {
    if (selectedFolder) {
      setEditFolderForm(selectedFolder)
      
      // Auto-expand parent folders in the tree view
      setCollapsedFolders(prev => {
        const next = new Set(prev)
        let currentId: string | null = selectedFolderId
        while (currentId) {
          next.delete(currentId)
          const folder = folders.find(f => f.id === currentId)
          currentId = folder?.parentId || null
        }
        return next
      })
    }
    setIsFolderEditMode(false)
  }, [selectedFolderId, folders])

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const newWidth = Math.max(200, Math.min(600, e.clientX - 100)) // 100px offset for layout
    setSidebarWidth(newWidth)
  }, [])

  const stopResizing = React.useCallback(() => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [handleMouseMove])

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResizing)
    }
  }, [handleMouseMove, stopResizing])

  const getFolderTestCaseCount = React.useCallback((folderId: string | null): number => {
    let count = testCases.filter(tc => tc.folderId === folderId).length
    const subFolders = folders.filter(f => f.parentId === folderId)
    subFolders.forEach(sf => {
      count += getFolderTestCaseCount(sf.id)
    })
    return count
  }, [folders, testCases])

  const currentFolderTestCaseCount = React.useMemo(() => {
    return getFolderTestCaseCount(selectedFolderId)
  }, [selectedFolderId, getFolderTestCaseCount])

  const handleSave = () => {
    if (selectedFileId && editForm) {
      updateTestCase(selectedFileId, editForm)
      toast.success('Test case updated successfully!')
    }
  }

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedItems.size} selected item(s)?`)) {
      selectedItems.forEach(id => {
        const isFolder = folders.some(f => f.id === id);
        if (isFolder) {
          deleteFolder(id);
        } else {
          deleteTestCase(id);
        }
      });
      setSelectedItems(new Set());
      toast.success('Selected items deleted successfully!');
    }
  }


  const handleSaveFolder = () => {
    if (selectedFolderId && editFolderForm) {
      updateFolder(selectedFolderId, editFolderForm)
      setIsFolderEditMode(false)
      toast.success('Folder updated successfully!')
    }
  }

  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string; isFile?: boolean }[] = [
      { id: null, name: 'All Projects' }
    ]

    if (!selectedFolderId && !selectedFileId) return breadcrumbs

    const path: { id: string; name: string; isFile?: boolean }[] = []
    
    if (selectedFile) {
      path.unshift({ id: selectedFile.id, name: selectedFile.title, isFile: true })
      let currentFolderId: string | null = selectedFile.folderId
      while (currentFolderId) {
        const folderId: string = currentFolderId
        const folder = folders.find(f => f.id === folderId)
        if (folder) {
          path.unshift({ id: folder.id, name: folder.name })
          currentFolderId = folder.parentId || null
        } else {
          break
        }
      }
    } else if (selectedFolder) {
      let currentFolderId: string | null = selectedFolder.id
      while (currentFolderId) {
        const folderId: string = currentFolderId
        const folder = folders.find(f => f.id === folderId)
        if (folder) {
          path.unshift({ id: folder.id, name: folder.name })
          currentFolderId = folder.parentId || null
        } else {
          break
        }
      }
    }

    return [...breadcrumbs, ...path]
  }

  const handleBack = () => {
    if (selectedFile) {
      setSelectedFolder(selectedFile.folderId)
    } else if (selectedFolder) {
      setSelectedFolder(selectedFolder.parentId)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'file') => {
    e.stopPropagation()
    setDraggedItem({ id, type })
    e.dataTransfer.setData('application/json', JSON.stringify({ id, type }))
    e.dataTransfer.effectAllowed = 'move'
    
    // Add a ghost image or effect if desired
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverFolderId(null)
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem) return
    
    // Cannot drop onto itself or into its own children
    if (draggedItem.type === 'folder' && folderId === draggedItem.id) return
    
    setDragOverFolderId(folderId)
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
    
    if (!draggedItem) return
    
    const { id, type } = draggedItem
    
    // Normalize targetFolderId (handle 'root' if it was passed)
    const normalizedTargetId = targetFolderId === 'root' ? null : targetFolderId
    
    if (type === 'folder') {
      // Robust iterative cycle prevention check
      const checkIsDescendant = (destId: string | null, draggedId: string): boolean => {
        let currentId = destId
        while (currentId) {
          if (currentId === draggedId) return true
          const folder = folders.find(f => f.id === currentId)
          currentId = folder?.parentId || null
        }
        return false
      }

      if (id === normalizedTargetId || checkIsDescendant(normalizedTargetId, id)) {
        toast.error('Cannot move folder into itself or its own descendants')
        return
      }

      moveFolder(id, normalizedTargetId)
      toast.success(`Folder moved successfully`)
    } else {
      // Test cases can move anywhere
      moveTestCase(id, normalizedTargetId)
      toast.success(`Test case moved successfully`)
    }
  }

  const { visibleFolders, visibleFiles, autoExpandIds } = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return { visibleFolders: folders, visibleFiles: testCases, autoExpandIds: new Set<string>() }
    }

    const query = searchQuery.toLowerCase()
    const matchedFolderIds = new Set<string>()
    const matchedFileIds = new Set<string>()
    const toExpand = new Set<string>()

    // 1. Find direct matches
    folders.forEach(f => {
      if (f.name.toLowerCase().includes(query) || f.tag.toLowerCase().includes(query)) {
        matchedFolderIds.add(f.id)
      }
    })
    testCases.forEach(tc => {
      if (tc.title.toLowerCase().includes(query) || tc.section.toLowerCase().includes(query)) {
        matchedFileIds.add(tc.id)
      }
    })

    // 2. If folder matches, include ALL its descendants
    const addDescendants = (parentId: string) => {
      folders.filter(f => f.parentId === parentId).forEach(f => {
        matchedFolderIds.add(f.id)
        toExpand.add(f.id)
        addDescendants(f.id)
      })
      testCases.filter(tc => tc.folderId === parentId).forEach(tc => {
        matchedFileIds.add(tc.id)
      })
    }
    
    // We need to iterate over a copy of matchedFolderIds from step 1
    // to avoid infinite loops if we were adding to it while iterating
    const initialMatchedFolders = Array.from(matchedFolderIds)
    initialMatchedFolders.forEach(id => {
      toExpand.add(id)
      addDescendants(id)
    })

    // 3. If file or folder matches, include ALL its ancestors
    const includeAncestors = (folderId: string | null) => {
      let currentId = folderId
      while (currentId) {
        matchedFolderIds.add(currentId)
        toExpand.add(currentId)
        const folder = folders.find(f => f.id === currentId)
        currentId = folder?.parentId || null
      }
    }

    testCases.filter(tc => matchedFileIds.has(tc.id)).forEach(tc => {
      includeAncestors(tc.folderId)
    })
    
    // Also include ancestors for folders that matched directly
    initialMatchedFolders.forEach(id => {
      const folder = folders.find(f => f.id === id)
      if (folder) includeAncestors(folder.parentId)
    })

    return {
      visibleFolders: folders.filter(f => matchedFolderIds.has(f.id)),
      visibleFiles: testCases.filter(tc => matchedFileIds.has(tc.id)),
      autoExpandIds: toExpand
    }
  }, [folders, testCases, searchQuery])

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setSearchExpandedFolders(autoExpandIds)
    }
  }, [searchQuery, autoExpandIds])

  const renderTreeView = (parentId: string | null = null, depth = 0) => {
    const currentFolders = visibleFolders.filter(f => f.parentId === parentId)
    const currentFiles = visibleFiles.filter(tc => tc.folderId === parentId)

    if (currentFolders.length === 0 && currentFiles.length === 0) return null

    return (
      <div className="space-y-1">
        {currentFolders.map(folder => {
          const isEffectivelyCollapsed = searchQuery.trim() 
            ? !searchExpandedFolders.has(folder.id)
            : collapsedFolders.has(folder.id)
            
          const hasChildren = visibleFolders.some(f => f.parentId === folder.id) || visibleFiles.some(tc => tc.folderId === folder.id)
          
          return (
            <div 
              key={folder.id}
              draggable
              onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={cn(
                "rounded-md transition-all",
                dragOverFolderId === folder.id ? "bg-primary/20 ring-2 ring-primary ring-inset" : ""
              )}
            >
              <button
                onClick={() => {
                  setSelectedFolder(folder.id)
                  if (searchQuery.trim()) {
                    setSearchExpandedFolders(prev => {
                      const next = new Set(prev)
                      if (next.has(folder.id)) next.delete(folder.id)
                      else next.add(folder.id)
                      return next
                    })
                  } else {
                    if (isEffectivelyCollapsed) {
                      toggleFolderCollapse({ stopPropagation: () => {} } as any, folder.id)
                    }
                  }
                }}
                className="w-full flex items-center pr-2 group transition-colors text-sm text-left"
              >
                <div 
                  className={cn(
                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors min-w-0",
                    !selectedFileId && selectedFolderId === folder.id ? "bg-primary/20 text-primary dark:text-indigo-300 font-semibold shadow-[0_0_10px_rgba(99,102,241,0.05)]" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-primary/10"
                  )}
                  style={{ marginLeft: `${depth * 16 + 4}px` }}
                >
                  <span 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (searchQuery.trim()) {
                        setSearchExpandedFolders(prev => {
                          const next = new Set(prev)
                          if (next.has(folder.id)) next.delete(folder.id)
                          else next.add(folder.id)
                          return next
                        })
                      } else {
                        toggleFolderCollapse(e, folder.id)
                      }
                    }}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {hasChildren ? (
                      isEffectivelyCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <div className="w-[14px]" />
                    )}
                  </span>
                  <Folder size={16} className={cn("shrink-0", !selectedFileId && selectedFolderId === folder.id ? "text-indigo-400" : "text-amber-500/80")} />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
              {!isEffectivelyCollapsed && renderTreeView(folder.id, depth + 1)}
            </div>
          )
        })}
        
        {currentFiles.length > 0 && (
          <div>
            {currentFiles.map(file => (
              <button
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id, 'file')}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedFile(file.id)}
                className="w-full flex items-center pr-2 group transition-colors text-sm text-left"
              >
                <div 
                  className={cn(
                    "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors min-w-0",
                    selectedFileId === file.id ? "bg-primary/20 text-primary dark:text-indigo-300 font-semibold shadow-[0_0_10px_rgba(99,102,241,0.05)]" : "text-slate-600 dark:text-slate-400 hover:bg-primary/10"
                  )}
                  style={{ marginLeft: `${(depth + 1) * 16 + 4}px` }}
                >
                  <FileText size={16} className={cn("shrink-0", selectedFileId === file.id ? "text-primary dark:text-indigo-400" : "text-blue-500/70")} />
                  <span className="shrink-0 text-[10px] font-mono font-bold bg-slate-100 dark:bg-surface-dark px-1 rounded text-slate-500">{file.tcId}</span>
                  <span className="truncate">{file.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('testruns')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
            activeTab === 'testruns'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <Play size={16} />
          Test Runs
        </button>
        <button
          onClick={() => setActiveTab('testcases')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
            activeTab === 'testcases'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <Beaker size={16} />
          Test Cases
        </button>
      </div>

      {/* ── Main Content: conditional on active tab ── */}
      {activeTab === 'testruns' ? (
        <TestRunsPage />
      ) : (
      <div className="flex flex-1 gap-0 min-h-0 relative group/container">
        {/* Left Sidebar: Tree View */}
        <div 
          className="flex flex-col bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl overflow-hidden shrink-0"
          style={{ width: `${sidebarWidth}px`, minWidth: '200px' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-border-brand shrink-0">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <Beaker className="text-primary" size={18} />
              Test Cases
            </h2>
            <div className="flex gap-1">
              <button 
                onClick={() => setAddFolderModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="New Folder"
              >
                <FolderPlus size={18} />
              </button>
              <button 
                onClick={() => {
                  if (!selectedFolderId) {
                    toast.error('Please select a folder first')
                    return
                  }
                  setAddFileModalOpen(true)
                }}
                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="New Test Case"
              >
                <FilePlus size={18} />
              </button>
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-200 dark:border-border-brand shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-brand rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {searchQuery.trim() && visibleFolders.length === 0 && visibleFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4 mt-8">
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center rounded-xl mb-3">
                  <Search className="text-slate-400 dark:text-slate-500" size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No results found</p>
                <p className="text-xs text-slate-500 mt-1">We couldn't find anything matching "{searchQuery}"</p>
              </div>
            ) : folders.length === 0 && testCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4 mt-8">
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center rounded-xl mb-3">
                  <Beaker className="text-slate-400 dark:text-slate-500" size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No projects yet</p>
                <p className="text-xs text-slate-500 mt-1">Click <strong>Folder+</strong> to get started</p>
              </div>
            ) : (
              <>
                <button
                   onClick={() => setSelectedFolder(null)}
                   onDragOver={(e) => handleDragOver(e, 'root')}
                   onDragLeave={handleDragLeave}
                   onDrop={(e) => handleDrop(e, 'root' as any)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-primary/20 transition-all text-sm font-medium text-left mb-2 cursor-pointer",
                      selectedFolderId === null && selectedFileId === null ? "bg-primary/20 text-primary dark:text-indigo-300 font-semibold" : "text-slate-600 dark:text-slate-400",
                      dragOverFolderId === 'root' ? "bg-primary/30 ring-2 ring-primary ring-inset" : ""
                    )}
                >
                  <FolderTree size={16} />
                  <span>All Projects</span>
                </button>
                {renderTreeView(null)}
              </>
            )}
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className="w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors mx-1 shrink-0 relative z-10"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-slate-200 dark:bg-slate-800 rounded-full my-8 opacity-50" />
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl overflow-hidden min-w-0">
          {/* Breadcrumbs & Back Header */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {(selectedFolderId || selectedFileId) && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500 dark:text-slate-400 shrink-0"
                title="Back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight size={12} className="shrink-0 text-slate-300" />}
                  <button
                    onClick={() => {
                      if (crumb.isFile) {
                        setSelectedFile(crumb.id)
                      } else {
                        setSelectedFolder(crumb.id)
                      }
                    }}
                    className={cn(
                      "hover:text-primary transition-colors truncate max-w-[120px]",
                      idx === getBreadcrumbs().length - 1 ? "font-semibold text-slate-700 dark:text-slate-200" : ""
                    )}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {selectedFile ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {selectedFile.tcId}
                        </span>
                        <input
                          type="text"
                          value={editForm.section || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))}
                          className="flex-1 text-xs font-medium text-slate-500 bg-transparent border-none focus:ring-0 p-0"
                          placeholder="Section"
                        />
                      </div>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0"
                        placeholder="Case Title"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group/item cursor-pointer">
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this test case?')) {
                          deleteTestCase(selectedFile.id)
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Case Type</span>
                    <input
                      type="text"
                      value={editForm.caseType || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, caseType: e.target.value }))}
                      className="mt-1 block w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Preconditions</h3>
                    <textarea
                      value={editForm.preconditions || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preconditions: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                      placeholder="No preconditions defined"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Steps</h3>
                    <textarea
                      value={editForm.steps || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, steps: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Expected Result</h3>
                    <textarea
                      value={editForm.expectedResult || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, expectedResult: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Created At</span>
                    <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-xs">{new Date(selectedFile.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Updated At</span>
                    <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-xs">{new Date(selectedFile.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium shadow-sm shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
               <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                 <div className="flex items-center gap-3">
                   <Folder size={24} className="text-amber-500 shrink-0" />
                   <div>
                     <h2 className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                       {selectedFolder ? selectedFolder.name : 'All Items'}
                       <span className="inline-flex items-center justify-center px-1.5 py-1 ml-1 text-[12px] leading-none text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                         {currentFolderTestCaseCount} Test Case
                       </span>
                     </h2>
                     {selectedFolder && selectedFolder.tag && (
                       <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                         {selectedFolder.tag.split(',').filter(t => t.trim() !== '').map((tagStr, idx) => (
                           <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] uppercase tracking-wider font-medium shrink-0">
                             {tagStr.trim()}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 {selectedFolder && (
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsFolderEditMode(!isFolderEditMode)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isFolderEditMode ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-primary hover:bg-primary/5"
                        )}
                        title="Edit Folder"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this folder and all its contents?')) {
                            deleteFolder(selectedFolder.id)
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>
                 )}
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-thin">
                 {isFolderEditMode ? (
                   <div className="p-6 max-w-2xl mx-auto space-y-6">
                     <div className="space-y-4">
                       <div>
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Folder Name</label>
                         <input
                           type="text"
                           value={editFolderForm.name || ''}
                           onChange={(e) => setEditFolderForm(prev => ({ ...prev, name: e.target.value }))}
                           className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                           placeholder="Folder Name"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Tag / Project</label>
                         <input
                           type="text"
                           value={editFolderForm.tag || ''}
                           onChange={(e) => setEditFolderForm(prev => ({ ...prev, tag: e.target.value }))}
                           className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                           placeholder="Tag (e.g., API, UI, Critical)"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Parent Folder</label>
                         <select
                           value={editFolderForm.parentId || ''}
                           onChange={(e) => setEditFolderForm(prev => ({ ...prev, parentId: e.target.value || null }))}
                           className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                         >
                           <option value="">Root</option>
                           {folders
                             .filter(f => {
                               // Cycle prevention: cannot be itself and cannot be its own descendant
                               if (f.id === selectedFolderId) return false
                               const isDescendant = (parentId: string | null): boolean => {
                                 if (!parentId) return false
                                 if (parentId === selectedFolderId) return true
                                 const parent = folders.find(folder => folder.id === parentId)
                                 return isDescendant(parent?.parentId || null)
                               }
                               return !isDescendant(f.parentId)
                             })
                             .map(f => (
                               <option key={f.id} value={f.id}>{f.name}</option>
                             ))}
                         </select>
                         <p className="mt-1 text-[10px] text-slate-400 italic">Select a new parent folder to move this folder.</p>
                       </div>
                     </div>
                     
                     <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                       <button
                         onClick={() => setIsFolderEditMode(false)}
                         className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                       >
                         Cancel
                       </button>
                       <button
                         onClick={handleSaveFolder}
                         className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium shadow-sm shadow-primary/20"
                       >
                         Update Folder
                       </button>
                     </div>
                   </div>
                 ) : (
                   <>
                     {folderContents.length > 0 && (
                       <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center gap-3 sticky top-0 z-[9]">
                         <button
                           onClick={() => {
                             setSelectedItems(new Set(folderContents.map(item => item.id)))
                           }}
                           className="text-[10px] font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                         >
                           Select All
                         </button>
                         <button
                           onClick={() => setSelectedItems(new Set())}
                           className="text-[10px] font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
                           disabled={selectedItems.size === 0}
                         >
                           Unselect All
                         </button>
                         
                         {selectedItems.size > 0 && (
                           <>
                              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 mr-1">Bulk Actions:</span>

                               <button
                                 onClick={handleBulkDelete}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                               >
                                 <Trash2 size={12} />
                                 Delete ({selectedItems.size})
                               </button>
                             </div>
                           </>
                         )}
                       </div>
                     )}
                     
                     {folderContents.length > 0 ? (
                       <div className="divide-y divide-slate-100 dark:divide-slate-800">
                         {folderContents.map((item) => {
                           const isFolder = 'name' in item
                           const isSelected = selectedItems.has(item.id)
                           return (
                             <div
                               key={item.id}
                               onClick={() => isFolder ? setSelectedFolder(item.id) : setSelectedFile(item.id)}
                               className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group pr-4"
                             >
                               <div className="flex items-center gap-0 flex-1 min-w-0 self-stretch">
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
                                       setSelectedItems(prev => {
                                         const next = new Set(prev);
                                         if (e.target.checked) next.add(item.id);
                                         else next.delete(item.id);
                                         return next;
                                       });
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
                                 <div className="flex items-center gap-3 py-2.5 flex-1 min-w-0 pr-4 pl-3 border-l border-transparent transition-colors">
                                   <div className={cn(
                                     "p-1.5 rounded-md shrink-0",
                                     isFolder ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                   )}>
                                     {isFolder ? <Folder size={12} /> : <FileText size={12} />}
                                   </div>
                                   <div className="flex-1 min-w-0 flex items-center gap-3">
                                     {isFolder ? null : (
                                       <span className="shrink-0 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">
                                         {(item as any).tcId}
                                       </span>
                                     )}
                                     <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{isFolder ? (item as any).name : (item as any).title}</p>
                                     {isFolder && (item as any).tag && (
                                       <div className="flex items-center gap-1.5 flex-wrap">
                                         {(item as any).tag.split(',').filter((t: string) => t.trim() !== '').map((tagStr: string, idx: number) => (
                                           <span key={idx} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] uppercase tracking-wider font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                                             {tagStr.trim()}
                                           </span>
                                         ))}
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-3 ml-4 py-2.5">
                                 <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-4 mt-8">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-3">
                            <ClipboardList className="text-slate-400" size={24} />
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No items found in this folder</p>
                          <p className="text-xs text-slate-500 mt-1">Click <strong>+</strong> or <strong>Folder +</strong> to add contents</p>
                        </div>
                     )}
                   </>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
      )}

      <AddFolderModal 
        isOpen={isAddFolderModalOpen} 
        onClose={() => setAddFolderModalOpen(false)} 
        parentId={selectedFolderId}
      />
      <AddFileModal 
        isOpen={isAddFileModalOpen} 
        onClose={() => setAddFileModalOpen(false)} 
        folderId={selectedFolderId || selectedFile?.folderId || ''}
      />
    </div>
  )
}

export default TestManagementPage
