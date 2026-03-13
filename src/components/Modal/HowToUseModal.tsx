import Modal from './Modal'
import { Lightbulb, Check, ScrollText, Play, Table, History, Download, Copy } from 'lucide-react'

interface HowToUseModalProps {
  isOpen: boolean
  onClose: () => void
}

const Step = ({ icon: Icon, title, description }: any) => (
  <div className="flex gap-4 items-start group">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
      <Icon size={20} />
    </div>
    <div className="space-y-1">
      <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        {title}
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
)

const HowToUseModal = ({ isOpen, onClose }: HowToUseModalProps) => {
  const steps = [
    {
      icon: ScrollText,
      title: "Prompt Instructions",
      description: "QA should input prompt instructions that will be used when generating test cases."
    },
    {
      icon: Table,
      title: "Use Template",
      description: "Click \"Use Template\" card to prefill User Story and Prompt fields correctly."
    },
    {
      icon: Play,
      title: "Enter Prompt",
      description: "Input User Story and detailed prompt including Preconditions and Acceptance Criteria."
    },
    {
      icon: Lightbulb,
      title: "Generate",
      description: "Click Generate button to let AI create structured test cases for you."
    },
    {
      icon: History,
      title: "Add to History",
      description: "Save your generations to the local history to review them later."
    },
    {
      icon: Download,
      title: "Export to Excel",
      description: "Download the generated test cases as a clean Excel spreadsheet."
    },
    {
      icon: Copy,
      title: "Copy Test Case",
      description: "Quickly copy test cases to your clipboard in a format suitable for sheets."
    }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How To Use AI TestGen" maxWidth="xl">
      <div className="space-y-8 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {steps.map((step, idx) => (
            <Step key={idx} {...step} />
          ))}
        </div>
        
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-3 text-sm text-blue-700 dark:text-blue-300 italic">
          <Check size={18} className="flex-shrink-0 mt-0.5" />
          Follow these steps to maximize the efficiency of your AI-driven QA workflow.
        </div>
      </div>
    </Modal>
  )
}

export default HowToUseModal
