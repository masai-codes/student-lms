import { AGREEMENT_FIELDS, COUNTRY_CODES } from './agreementFormConfig'
import { isFieldVisible, sanitizePan } from './agreementValidation'
import {
  DateField,
  NumberField,
  PhoneField,
  SelectField,
  TextField,
} from '@/components/ui/form-fields'
import type {
  AgreementFieldKey,
  AgreementFormValues,
} from '@/server/api/dashboard/agreement/agreementShared'

interface AgreementDetailsFormProps {
  values: AgreementFormValues
  errors: Partial<Record<AgreementFieldKey, string>>
  showErrors: boolean
  onChange: (key: AgreementFieldKey, value: string) => void
}

const COUNTRY_OPTIONS = COUNTRY_CODES.map((c) => ({
  value: c.value,
  label: c.label,
}))

/**
 * Renders the agreement detail form from {@link AGREEMENT_FIELDS} using the
 * shared dumb field components — no per-field JSX. Presentation-only: the parent
 * owns `values`/`errors` and handles changes.
 */
export function AgreementDetailsForm({
  values,
  errors,
  showErrors,
  onChange,
}: AgreementDetailsFormProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="agreement-details-form">
      {AGREEMENT_FIELDS.filter((field) => isFieldVisible(field, values)).map(
        (field) => {
          const id = `agreement-${field.key}`
          const error = showErrors ? (errors[field.key] ?? null) : null
          const value = values[field.key] ?? ''
          const testid = `agreement-field-${field.key}`

          if (field.type === 'select') {
            return (
              <SelectField
                key={field.key}
                id={id}
                label={field.label}
                value={value}
                options={field.options ?? []}
                required={field.required}
                error={error}
                hint={field.hint}
                placeholder={field.placeholder}
                contentClassName="z-[210]"
                onChange={(v) => onChange(field.key, v)}
                data-testid={testid}
              />
            )
          }
          if (field.type === 'date') {
            return (
              <DateField
                key={field.key}
                id={id}
                label={field.label}
                value={value}
                required={field.required}
                error={error}
                hint={field.hint}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(v) => onChange(field.key, v)}
                data-testid={testid}
              />
            )
          }
          if (field.type === 'number') {
            return (
              <NumberField
                key={field.key}
                id={id}
                label={field.label}
                value={value}
                required={field.required}
                error={error}
                hint={field.hint}
                min={0}
                step={0.1}
                onChange={(v) => onChange(field.key, v)}
                data-testid={testid}
              />
            )
          }
          if (field.type === 'phone' && field.countryKey) {
            return (
              <PhoneField
                key={field.key}
                id={id}
                label={field.label}
                required={field.required}
                error={error}
                hint={field.hint}
                placeholder={field.placeholder}
                contentClassName="z-[210]"
                countryOptions={COUNTRY_OPTIONS}
                countryValue={values[field.countryKey] ?? ''}
                onCountryChange={(v) =>
                  onChange(field.countryKey as AgreementFieldKey, v)
                }
                numberValue={value}
                onNumberChange={(v) => onChange(field.key, v)}
                data-testid={testid}
              />
            )
          }
          return (
            <TextField
              key={field.key}
              id={id}
              label={field.label}
              value={value}
              type={field.type === 'email' ? 'email' : 'text'}
              required={field.required}
              error={error}
              hint={field.hint}
              maxLength={field.maxLength}
              placeholder={field.placeholder}
              onChange={(v) =>
                onChange(
                  field.key,
                  field.key === 'panNumber' ? sanitizePan(v) : v,
                )
              }
              data-testid={testid}
            />
          )
        },
      )}
    </div>
  )
}
