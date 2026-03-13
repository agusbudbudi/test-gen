import { useToastStore, Toast as ToastType } from '@/stores/toastStore'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const Toast = ({ toast }: { toast: ToastType }) => {
  const removeToast = useToastStore((state) => state.removeToast)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        "min-w-[320px]"
      )}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastContainer
