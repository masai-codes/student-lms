import type { CreateEnrolmentInput } from '@/server/api/webhooks/admissions/types'

/**
 * Strip secrets from an enrolment payload before it is persisted to the
 * `admissionPayloadHistory` audit trail. The plaintext `password` must never be
 * stored; everything else is kept verbatim for future reference/debugging.
 */
export function redactEnrolmentPayload(
  input: CreateEnrolmentInput,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = { ...input }
  delete redacted.password
  return redacted
}
