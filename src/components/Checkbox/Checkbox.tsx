import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label: React.ReactNode
  description?: string
  disabled?: boolean
  className?: string
}

// Reusable labeled checkbox matching the app's custom checkbox style (a
// bordered square with a check icon) used e.g. in TestManagement's test
// case picker, rather than a native <input type="checkbox">.
const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'flex items-start gap-2.5 py-1.5 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault()
          onChange()
        }}
        className={cn(
          'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
          checked
            ? 'bg-primary border-primary text-white'
            : 'border-slate-300 dark:border-slate-600 group-hover:border-primary/60',
        )}
      >
        {checked && <Check size={10} strokeWidth={3} />}
      </button>
      <span className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
        {label}
        {description && (
          <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {description}
          </span>
        )}
      </span>
    </label>
  )
}

export default Checkbox
