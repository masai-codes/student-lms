import { FieldShell } from './FieldShell'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface DateFieldProps {
  id: string
  label: string
  /** ISO date string (yyyy-mm-dd). */
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string | null
  hint?: string
  /** yyyy-mm-dd upper bound (e.g. today for a past-only date). */
  max?: string
  min?: string
  disabled?: boolean
  'data-testid'?: string
}

/** Dumb native date field. */
export function DateField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  hint,
  max,
  min,
  disabled,
  'data-testid': dataTestId,
}: DateFieldProps) {
  return (
    <FieldShell htmlFor={id} label={label} required={required} error={error} hint={hint} data-testid={dataTestId}>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500/30')}
        data-testid={dataTestId ? `${dataTestId}-input` : undefined}
      />
    </FieldShell>
  )
}
