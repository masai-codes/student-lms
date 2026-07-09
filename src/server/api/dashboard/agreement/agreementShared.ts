/**
 * Shared constants + helpers for the legal-agreement feature (read + write).
 *
 * The agreement config lives in `sections.settings.agreements`:
 *   { shouldModalBeVisible: boolean, [key]: { heading, pdfUrl, order?, hidePolicy? } }
 * Each non-reserved key with a heading + pdfUrl (and hidePolicy !== true) is one
 * signable document ("step"). User progress is stored in
 * `profiles.legal_data.agreements.section_<id>`.
 */

/** Keys in `settings.agreements` that are NOT signable documents. */
export const RESERVED_AGREEMENT_KEYS = new Set(['shouldModalBeVisible'])

/** Fallback ordering when steps have no explicit `order` (legacy). */
export const DEFAULT_AGREEMENT_ORDER = ['program_agreement', 'grading_policy', 'posh_compliance']

/**
 * Days a learner has to review + sign an agreement after first viewing it,
 * before LMS access is paused (matches the old LMS's 7-day countdown).
 */
export const AGREEMENT_REVIEW_DAYS = 7

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Whole days elapsed since `viewTime` (0 when never viewed). */
export function daysSinceAgreementView(viewTime: string | null): number {
  if (!viewTime) return 0
  const viewed = new Date(viewTime).getTime()
  if (Number.isNaN(viewed)) return 0
  return Math.max(0, Math.floor((istNow().getTime() - viewed) / DAY_MS))
}

/**
 * State of the {@link AGREEMENT_REVIEW_DAYS}-day review window, keyed off the
 * first-view time. Counts down in days while a full day or more remains; under
 * a day it switches to an hours count (`daysLeft: 0`, `hoursLeft` min 1) for
 * urgency, matching the fee-payment banner. `isClosable` is false once the
 * window has elapsed (LMS access is paused until signed).
 */
export interface AgreementCountdown {
  daysSinceFirstView: number
  daysLeft: number
  hoursLeft: number | null
  isClosable: boolean
}

export function computeAgreementCountdown(viewTime: string | null): AgreementCountdown {
  // Never viewed → the full window hasn't started; show it in days.
  const viewed = viewTime ? new Date(viewTime).getTime() : NaN
  if (!viewTime || Number.isNaN(viewed)) {
    return { daysSinceFirstView: 0, daysLeft: AGREEMENT_REVIEW_DAYS, hoursLeft: null, isClosable: true }
  }

  const now = istNow().getTime()
  const daysSinceFirstView = Math.max(0, Math.floor((now - viewed) / DAY_MS))
  const remainingMs = viewed + AGREEMENT_REVIEW_DAYS * DAY_MS - now

  // Window elapsed → paused, no countdown.
  if (remainingMs <= 0) {
    return { daysSinceFirstView, daysLeft: 0, hoursLeft: null, isClosable: false }
  }
  // A full day or more left → count in days; otherwise switch to hours (min 1).
  if (remainingMs >= DAY_MS) {
    return { daysSinceFirstView, daysLeft: Math.ceil(remainingMs / DAY_MS), hoursLeft: null, isClosable: true }
  }
  return { daysSinceFirstView, daysLeft: 0, hoursLeft: Math.max(1, Math.ceil(remainingMs / HOUR_MS)), isClosable: true }
}

/** Logo drawn on the generated signature-certificate page (same asset as the old LMS). */
export const AGREEMENT_LOGO_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/34e1ca27-70cf-42fc-b2df-3eb7a8f3f5fa/JeIdQtdjGnEcUh3S.png'

/** The `profiles.legal_data.agreements` sub-key for a section. */
export function sectionAgreementKey(sectionId: number): string {
  return `section_${sectionId}`
}

/** Reference number stamped on the certificate — `TC-<userId>-section_<id>` (old LMS format). */
export function buildReferenceNumber(userId: number, sectionId: number): string {
  return `TC-${userId}-${sectionAgreementKey(sectionId)}`
}

/** "Now" as an IST-adjusted Date, matching the old LMS's +5.5h timestamps. */
export function istNow(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
}

export interface AgreementStepDoc {
  key: string
  heading: string
  pdfUrl: string
  order: number | null
}

/** The detail form fields collected for an agreement (all stored as strings). */
export const AGREEMENT_FORM_FIELDS = [
  'name', 'address', 'location', 'dateOfBirth', 'gender',
  'parentsName', 'parentsEmail', 'parentsMobileCountry', 'parentsMobile',
  'currentStatus', 'studyYear', 'workDomain', 'educationDetails',
  'graduationYear', 'collegeName', 'companyName', 'workExperience', 'ctc',
  'panNumber', 'passportNumber',
] as const

export type AgreementFieldKey = (typeof AGREEMENT_FORM_FIELDS)[number]
export type AgreementFormValues = Partial<Record<AgreementFieldKey, string>>

/** Whitelists an arbitrary object down to the known agreement form fields (as strings). */
export function pickAgreementFormValues(source: Record<string, unknown>): AgreementFormValues {
  const out: AgreementFormValues = {}
  for (const key of AGREEMENT_FORM_FIELDS) {
    const v = source[key]
    if (v !== undefined && v !== null) out[key] = String(v)
  }
  return out
}

function isSignableDoc(value: unknown): value is { heading: string; pdfUrl: string; order?: unknown; hidePolicy?: unknown } {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.heading === 'string' && v.heading.trim() !== '' &&
    typeof v.pdfUrl === 'string' && v.pdfUrl.trim() !== '' &&
    v.hidePolicy !== true && v.hidePolicy !== 'true'
  )
}

/**
 * Turns a section's `settings.agreements` JSON into ordered signable steps.
 * Ordering: any steps with an explicit numeric `order` sort ascending after the
 * unordered ones; unordered fall back to {@link DEFAULT_AGREEMENT_ORDER} then
 * insertion order (matches the old LMS).
 */
export function buildAgreementSteps(agreementsJson: Record<string, unknown>): Array<AgreementStepDoc> {
  const docs: Array<AgreementStepDoc> = []
  for (const [key, value] of Object.entries(agreementsJson)) {
    if (RESERVED_AGREEMENT_KEYS.has(key) || !isSignableDoc(value)) continue
    const rawOrder = Number((value as { order?: unknown }).order)
    docs.push({ key, heading: value.heading, pdfUrl: value.pdfUrl, order: Number.isFinite(rawOrder) ? rawOrder : null })
  }

  return docs.sort((a, b) => {
    if (a.order !== null && b.order !== null) return a.order - b.order
    if (a.order !== null) return 1 // ordered come after unordered
    if (b.order !== null) return -1
    const ai = DEFAULT_AGREEMENT_ORDER.indexOf(a.key)
    const bi = DEFAULT_AGREEMENT_ORDER.indexOf(b.key)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return 0
  })
}

/** Whether the agreement config marks a section as having any signable doc. */
export function hasSignableAgreement(agreementsJson: Record<string, unknown> | null): boolean {
  return agreementsJson !== null && buildAgreementSteps(agreementsJson).length > 0
}
