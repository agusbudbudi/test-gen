
import React from 'react'
import Modal from './Modal'
import { useUIStore } from '@/stores/uiStore'
import { Check, Layout, Smartphone, Globe, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (templateId: string) => void
  selectedId: string
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedId 
}) => {
  const { testCaseTemplates } = useUIStore()

  const getIcon = (id: string) => {
    switch (id) {
      case 'web': return <Globe size={20} />
      case 'mobile': return <Smartphone size={20} />
      case 'api': return <Layout size={20} />
      case 'edge': return <AlertCircle size={20} />
      default: return <Layout size={20} />
    }
  }

  const getBadgeColor = (id: string) => {
    switch (id) {
      case 'web': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      case 'mobile': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
      case 'api': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'edge': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Template Type" maxWidth="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {testCaseTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => {
              onSelect(template.id)
              onClose()
            }}
            className={cn(
              "flex flex-col items-start p-5 rounded-2xl border transition-all text-left group relative",
              selectedId === template.id 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-slate-200 dark:border-slate-700/50 hover:border-primary/50 bg-white dark:bg-slate-800"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
              getBadgeColor(template.id)
            )}>
              {getIcon(template.id)}
            </div>
            
            <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              {template.name}
              {selectedId === template.id && (
                <Check size={16} className="text-primary" />
              )}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {template.prompt}
            </p>

            {selectedId === template.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                  <Check size={14} strokeWidth={3} />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default TemplateSelectionModal
