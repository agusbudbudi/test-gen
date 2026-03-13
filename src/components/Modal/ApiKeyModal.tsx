import { useState } from 'react'
import Modal from './Modal'
import { useUIStore } from '@/stores/uiStore'
import { useToast } from '@/hooks/useToast'
import { Key } from 'lucide-react'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

const ApiKeyModal = ({ isOpen, onClose }: ApiKeyModalProps) => {
  const { 
    apiKey, setApiKey, clearApiKey, 
    selectedModel, setSelectedModel, 
    defaultTestCaseCount, setDefaultTestCaseCount 
  } = useUIStore()
  const [inputValue, setInputValue] = useState('')
  const toast = useToast()

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim())
      setInputValue('')
      toast.success('Settings saved successfully!')
    } else if (apiKey) {
      toast.success('Settings updated!')
    } else {
      toast.info('Settings updated')
    }
    onClose()
  }

  const handleClear = () => {
    clearApiKey()
    setInputValue('')
    toast.info('API Key has been cleared')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            OpenAI API Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              placeholder={apiKey ? 'API Key already saved' : 'Enter OpenAI API Key'}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-slate-200"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          {apiKey && !inputValue && (
            <p className="text-xs text-green-500 font-medium pt-1">
              ✓ API Key is currently saved.
            </p>
          )}
        </div>
        
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            OpenAI Model
          </label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-slate-200"
          >
            <option value="gpt-4o">gpt-4o (Most Capable)</option>
            <option value="gpt-4o-mini">gpt-4o-mini (Faster & Cheaper)</option>
            <option value="gpt-4-turbo">gpt-4-turbo (Reliable & Powerful)</option>
            <option value="o3-mini">o3-mini (Advanced Reasoning)</option>
            <option value="o1">o1 (Complex Reasoning)</option>
          </select>
        </div>

        {/* Default Test Case Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Default Test Case Count
          </label>
          <input 
            type="number"
            min="1"
            max="30"
            value={defaultTestCaseCount}
            onChange={(e) => setDefaultTestCaseCount(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all dark:text-slate-200"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            Save Settings
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ApiKeyModal
