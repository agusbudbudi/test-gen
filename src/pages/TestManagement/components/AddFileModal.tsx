import React, { useState } from 'react'
import Modal from '@/components/Modal/Modal'
import { useTestCaseStore } from '@/stores/testCaseStore'

interface AddFileModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: string
}

const AddFileModal: React.FC<AddFileModalProps> = ({ isOpen, onClose, folderId }) => {
  const addTestCase = useTestCaseStore((state) => state.addTestCase)

  const [formData, setFormData] = useState({
    section: '',
    caseType: '',
    title: '',
    preconditions: '',
    steps: '',
    expectedResult: '',
    tags: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    addTestCase({
      ...formData,
      folderId
    })

    setFormData({
      section: '',
      caseType: '',
      title: '',
      preconditions: '',
      steps: '',
      expectedResult: '',
      tags: ''
    })
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Test Case" maxWidth="lg" noPadding>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Section
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
              placeholder="e.g. Login"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Case Type
            </label>
            <input
              type="text"
              name="caseType"
              value={formData.caseType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
              placeholder="e.g. Functional"
            />
          </div>
        </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
            placeholder="e.g. User should be able to login with valid credentials"
            required
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Preconditions
          </label>
          <textarea
            name="preconditions"
            value={formData.preconditions}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
            placeholder="e.g. User is on the login page"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Steps
          </label>
          <textarea
            name="steps"
            value={formData.steps}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
            placeholder="1. Enter email..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Expected Result
          </label>
          <textarea
            name="expectedResult"
            value={formData.expectedResult}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
            placeholder="Success message appears..."
            required
          />
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-sm"
            placeholder="e.g. sprint-12, sanity, regression"
          />
        </div>

        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm shadow-primary/20"
          >
            Add Test Case
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddFileModal
