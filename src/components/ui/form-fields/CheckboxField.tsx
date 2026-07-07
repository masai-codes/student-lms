import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxFieldProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Label content — can be rich (links, bold). */
  children: ReactNode
  disabled?: boolean
  error?: string | null
  'data-testid'?: string
}

/**
 * Dumb checkbox + inline label, used for "I acknowledge / accept" style
 * consents. Presentation-only; the caller owns the checked state.
 */
export function CheckboxField({
  id,
  checked,
  onChange,
  children,
  disabled,
  error,
  'data-testid': dataTestId,
}: CheckboxFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            'mt-0.5 size-4 shrink-0 rounded border-gray-300 text-[#6962AC] focus-visible:ring-2 focus-visible:ring-[#6962AC]',
            error && 'border-red-500',
          )}
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
