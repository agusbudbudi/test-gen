import { useState, useEffect } from 'react'
import Modal from './Modal'
import { useUIStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'

interface PromptInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
}

const PromptInstructionsModal = ({ isOpen, onClose }: PromptInstructionsModalProps) => {
  const { promptInstructions, setPromptInstructions } = useUIStore()
  const [inputValue, setInputValue] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      setInputValue(promptInstructions)
    }
  }, [isOpen, promptInstructions])

  const handleSave = () => {
    setPromptInstructions(inputValue.trim())
    toast.success('Prompt instructions saved.')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prompt Instructions" maxWidth="lg">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Reusable Prompt Instructions
          </label>
          <textarea
            placeholder="Enter instructions that will be appended to every generation..."
            className="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-sm leading-relaxed"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <p className="text-xs text-slate-500 italic">
            These instructions will be combined with your specific prompt details during generation.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            Save Instructions
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PromptInstructionsModal
