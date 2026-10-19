import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  className?: string
}

// Reusable custom dropdown matching the app's floating-menu style (see
// BugReportPage's Smart Copy menu) instead of a native <select>, so the
// option list can be styled consistently with the rest of the design system.
const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  placeholder = 'Select…',
  className,
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const isDisabled = disabled || loading

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !isDisabled && setOpen((prev) => !prev)}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-surface-dark border rounded-xl outline-none transition-all text-sm text-left',
          open
            ? 'border-primary ring-2 ring-primary'
            : 'border-slate-200 dark:border-border-brand',
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
        )}
      >
        <span
          className={cn(
            'truncate',
            value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500',
          )}
        >
          {value || placeholder}
        </span>
        {loading ? (
          <Loader2 size={15} className="shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown
            size={15}
            className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        )}
      </button>

      {open && !isDisabled && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-surface-card border border-slate-200 dark:border-border-brand rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No options available.</div>
          ) : (
            options.map((option) => {
              const selected = option === value
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    selected
                      ? 'text-primary font-semibold bg-primary/5'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                >
                  <span className="truncate">{option}</span>
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown
