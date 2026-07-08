import { AGREEMENT_FIELDS, COUNTRY_CODES } from './agreementFormConfig'
import type { AgreementFieldDef } from './agreementFormConfig'
import type { AgreementFieldKey, AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const YEAR_RE = /^\d{4}$/

/** Uppercase, strip non-alphanumerics, cap at 10 — matches the old LMS PAN input. */
export function sanitizePan(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

/** Today as yyyy-mm-dd (for the DOB max bound). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isFieldVisible(field: AgreementFieldDef, values: AgreementFormValues): boolean {
  return field.showWhen ? field.showWhen(values) : true
}

function trimmed(values: AgreementFormValues, key: AgreementFieldKey): string {
  return (values[key] ?? '').trim()
}

/**
 * Validates the detail form, returning an error message per invalid field key.
 * An empty object means the form is complete + valid. Pure — safe to call on
 * every render for live disabling.
 */
export function validateAgreementDetails(values: AgreementFormValues): Partial<Record<AgreementFieldKey, string>> {
  const errors: Partial<Record<AgreementFieldKey, string>> = {}

  for (const field of AGREEMENT_FIELDS) {
    if (!isFieldVisible(field, values)) continue
    if (field.required && !trimmed(values, field.key)) {
      errors[field.key] = 'This field is required.'
    }
  }

  // `location` is best-effort auto-fill (geolocation consent) — NOT required, so
  // it never blocks Continue when the browser denies / can't provide a location.

  if (values.parentsEmail && !EMAIL_RE.test(values.parentsEmail.trim())) {
    errors.parentsEmail = 'Enter a valid email address.'
  }

  const country = COUNTRY_CODES.find((c) => c.value === values.parentsMobileCountry)
  const mobile = trimmed(values, 'parentsMobile')
  if (mobile) {
    if (!country) errors.parentsMobile = 'Select a country code.'
    else if (mobile.length !== country.length) errors.parentsMobile = `Enter a ${country.length}-digit number.`
  }

  if (values.graduationYear && !YEAR_RE.test(values.graduationYear.trim())) {
    errors.graduationYear = 'Enter a 4-digit year.'
  }

  const pan = (values.panNumber ?? '').trim()
  if (pan && !PAN_RE.test(pan)) errors.panNumber = 'Format should be ABCDE1234F.'

  if (values.dateOfBirth && values.dateOfBirth > todayIso()) {
    errors.dateOfBirth = 'Date of birth cannot be in the future.'
  }

  for (const key of ['workExperience', 'ctc'] as const) {
    const raw = trimmed(values, key)
    if (raw && Number(raw) < 0) errors[key] = 'Cannot be negative.'
  }

  return errors
}

export function isAgreementDetailsValid(values: AgreementFormValues): boolean {
  return Object.keys(validateAgreementDetails(values)).length === 0
}

export interface AgreementFieldIssue {
  key: AgreementFieldKey
  label: string
  message: string
}

/**
 * Turns the raw error map into an ordered, human-readable list of issues — one
 * per invalid *visible* field, in the form's own top-to-bottom order — so the UI
 * can tell the learner exactly what to fix and why "Continue" is blocked.
 */
export function getAgreementFieldIssues(values: AgreementFormValues): Array<AgreementFieldIssue> {
  const errors = validateAgreementDetails(values)
  const issues: Array<AgreementFieldIssue> = []
  for (const field of AGREEMENT_FIELDS) {
    if (!isFieldVisible(field, values)) continue
    const message = errors[field.key]
    if (message) issues.push({ key: field.key, label: field.label, message })
  }
  return issues
}
