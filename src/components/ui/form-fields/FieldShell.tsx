import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FieldShellProps {
  /** Input id, also used for the label's htmlFor. */
  htmlFor?: string
  label: string
  required?: boolean
  error?: string | null
  /** Optional helper text shown under the control (hidden while an error shows). */
  hint?: string
  className?: string
  children: ReactNode
  'data-testid'?: string
}

/**
 * Presentational wrapper for a form field: label (+ required asterisk), the
 * control, and an error / hint line. Pure and dumb — every concrete field
 * component composes this so labels, spacing, and error styling stay identical.
 */
export function FieldShell({
  htmlFor,
  label,
  required,
  error,
  hint,
  className,
  children,
  'data-testid': dataTestId,
}: FieldShellProps) {
  return (
    <div
      className={cn('flex flex-col gap-1.5', className)}
      data-testid={dataTestId}
    >
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p
          className="text-xs text-danger"
          data-testid={dataTestId ? `${dataTestId}-error` : undefined}
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-foreground-muted">{hint}</p>
      ) : null}
    </div>
  )
}
