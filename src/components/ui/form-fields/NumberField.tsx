import { FieldShell } from './FieldShell'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface NumberFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string | null
  hint?: string
  placeholder?: string
  min?: number
  step?: number
  disabled?: boolean
  'data-testid'?: string
}

/** Dumb numeric field (kept as a string value so empty/partial input is representable). */
export function NumberField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  hint,
  placeholder,
  min,
  step,
  disabled,
  'data-testid': dataTestId,
}: NumberFieldProps) {
  return (
    <FieldShell htmlFor={id} label={label} required={required} error={error} hint={hint} data-testid={dataTestId}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500/30')}
        data-testid={dataTestId ? `${dataTestId}-input` : undefined}
      />
    </FieldShell>
  )
}
