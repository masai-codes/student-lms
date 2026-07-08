import { FieldShell } from './FieldShell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<SelectOption>
  required?: boolean
  error?: string | null
  hint?: string
  placeholder?: string
  disabled?: boolean
  /** Extra classes for the trigger (e.g. width). */
  triggerClassName?: string
  /** Extra classes for the dropdown panel (e.g. `z-[210]` when inside an overlay). */
  contentClassName?: string
  'data-testid'?: string
}

/** Dumb select built on the shared shadcn Select. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  error,
  hint,
  placeholder = 'Select…',
  disabled,
  triggerClassName,
  contentClassName,
  'data-testid': dataTestId,
}: SelectFieldProps) {
  return (
    <FieldShell htmlFor={id} label={label} required={required} error={error} hint={hint} data-testid={dataTestId}>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn('w-full', error && 'border-red-500', triggerClassName)}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} data-testid={dataTestId ? `${dataTestId}-option-${opt.value}` : undefined}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
