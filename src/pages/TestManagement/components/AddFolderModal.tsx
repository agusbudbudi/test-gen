import React, { useState } from 'react'
import Modal from '@/components/Modal/Modal'
import { useTestCaseStore } from '@/stores/testCaseStore'

interface AddFolderModalProps {
  isOpen: boolean
  onClose: () => void
  parentId: string | null
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({ isOpen, onClose, parentId }) => {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const addFolder = useTestCaseStore((state) => state.addFolder)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    addFolder(name, tag, parentId)
    setName('')
    setTag('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
            placeholder="e.g. Authentication"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tag
          </label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
            placeholder="e.g. API, UI, Critical (comma separated)"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Create Folder
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddFolderModal
