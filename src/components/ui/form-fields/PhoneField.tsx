import { FieldShell } from './FieldShell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { SelectOption } from './SelectField'

export interface PhoneFieldProps {
  id: string
  label: string
  /** Dial code, e.g. "+91". */
  countryValue: string
  onCountryChange: (value: string) => void
  numberValue: string
  onNumberChange: (value: string) => void
  countryOptions: Array<SelectOption>
  required?: boolean
  error?: string | null
  hint?: string
  placeholder?: string
  disabled?: boolean
  /** Extra classes for the country dropdown panel (e.g. `z-[210]` inside an overlay). */
  contentClassName?: string
  'data-testid'?: string
}

/**
 * Dumb phone field: a country-dial-code select next to a digits-only number
 * input. Digits are enforced here (formatting only); length/validity is the
 * caller's job via `error`.
 */
export function PhoneField({
  id,
  label,
  countryValue,
  onCountryChange,
  numberValue,
  onNumberChange,
  countryOptions,
  required,
  error,
  hint,
  placeholder,
  disabled,
  contentClassName,
  'data-testid': dataTestId,
}: PhoneFieldProps) {
  return (
    <FieldShell htmlFor={id} label={label} required={required} error={error} hint={hint} data-testid={dataTestId}>
      <div className="flex gap-2">
        <Select value={countryValue || undefined} onValueChange={onCountryChange} disabled={disabled}>
          <SelectTrigger
            aria-label="Country code"
            className={cn('w-28 shrink-0', error && 'border-red-500')}
            data-testid={dataTestId ? `${dataTestId}-country` : undefined}
          >
            <SelectValue placeholder="+" />
          </SelectTrigger>
          <SelectContent className={contentClassName}>
            {countryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          value={numberValue}
          onChange={(e) => onNumberChange(e.target.value.replace(/\D/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn('flex-1', error && 'border-red-500 focus-visible:ring-red-500/30')}
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
        />
      </div>
    </FieldShell>
  )
}
