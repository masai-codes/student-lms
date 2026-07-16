import { FieldShell } from './FieldShell'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  error?: string | null
  hint?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  inputMode?: 'text' | 'email' | 'numeric' | 'tel'
  autoComplete?: string
  'data-testid'?: string
}

/**
 * Dumb single-line text/email/tel field. Owns no validation — the caller passes
 * `value`, `error`, and `onChange`. Reusable in any form.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  error,
  hint,
  placeholder,
  maxLength,
  disabled,
  inputMode,
  autoComplete,
  'data-testid': dataTestId,
}: TextFieldProps) {
  return (
    <FieldShell
      htmlFor={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      data-testid={dataTestId}
    >
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className={cn(error && 'border-danger focus-visible:ring-danger/30')}
        data-testid={dataTestId ? `${dataTestId}-input` : undefined}
      />
    </FieldShell>
  )
}
