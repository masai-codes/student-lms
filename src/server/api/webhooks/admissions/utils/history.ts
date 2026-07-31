/**
 * Helpers for the append-only audit trails we keep on enrolment rows:
 * - `batch_user.history` holds `{ timeline: [...], admissionPayloadHistory: [...] }`
 * - `section_user.meta` holds `{ history: [...] }`
 *
 * Both are read-modify-write against a JSON column, so every helper preserves any
 * pre-existing keys on the object and never mutates the input.
 */

export type TimelineEntry = {
  type: string
  date: string
  [key: string]: unknown
}

/** One raw webhook payload we received, kept for future reference/debugging. */
export type AdmissionPayloadEntry = {
  type: string
  date: string
  payload: unknown
}

type JsonRecord = Record<string, unknown> | null | undefined

function toArray(value: unknown): TimelineEntry[] {
  return Array.isArray(value) ? (value as TimelineEntry[]) : []
}

/** Fresh `batch_user.history` value for a brand-new row. */
export function newTimeline(entry: TimelineEntry): {
  timeline: TimelineEntry[]
} {
  return { timeline: [entry] }
}

/** Append to `batch_user.history.timeline`, keeping any other keys intact. */
export function appendTimelineEntry(
  existing: JsonRecord,
  entry: TimelineEntry,
): Record<string, unknown> {
  const base = existing ?? {}
  return { ...base, timeline: [...toArray(base.timeline), entry] }
}

/** Fresh `section_user.meta` value for a brand-new row. */
export function newSectionHistory(entry: TimelineEntry): {
  history: TimelineEntry[]
} {
  return { history: [entry] }
}

/** Append to `section_user.meta.history`, keeping any other keys intact. */
export function appendSectionHistory(
  existing: JsonRecord,
  entry: TimelineEntry,
): Record<string, unknown> {
  const base = existing ?? {}
  return { ...base, history: [...toArray(base.history), entry] }
}

/**
 * Append the raw webhook payload to `batch_user.history.admissionPayloadHistory`,
 * keeping any other keys (e.g. `timeline`) intact. Lets us reconstruct exactly
 * what the admissions platform sent, and when, for each enrol/cancel call.
 */
export function appendAdmissionPayload(
  existing: JsonRecord,
  entry: AdmissionPayloadEntry,
): Record<string, unknown> {
  const base = existing ?? {}
  const list = Array.isArray(base.admissionPayloadHistory)
    ? base.admissionPayloadHistory
    : []
  return { ...base, admissionPayloadHistory: [...list, entry] }
}
