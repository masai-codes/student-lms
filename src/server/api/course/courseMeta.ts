/**
 * Shared readers for the loosely-typed `batches.meta` / `batches.settings` JSON
 * blobs. Both the program listing (`/api/courses`) and the program detail page
 * (`/api/course/:batchId`) read the same fields, and they MUST agree — a student
 * seeing 40% on the listing and 55% on the detail page for the same program is a
 * bug. Every derivation of those shared fields lives here.
 */

export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function arr<T>(v: unknown): Array<T> {
  return Array.isArray(v) ? (v as Array<T>) : []
}

export function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

/** Programs with no `meta.instituteName` are Masai's own. */
export const DEFAULT_INSTITUTE_NAME = 'Masai'

export function resolveCourseTitle(
  meta: Record<string, unknown>,
  batchName: string,
): string {
  return str(meta.courseTitle).trim() || batchName
}

export function resolveInstituteName(meta: Record<string, unknown>): string {
  return (
    str(meta.instituteName ?? meta.institute ?? meta.collegeName).trim() ||
    DEFAULT_INSTITUTE_NAME
  )
}

export function resolveCourseLogo(
  meta: Record<string, unknown>,
): string | null {
  return str(meta.courseLogo).trim() || null
}

export interface RawTimelineMilestone {
  date: string
  label: string
}

/**
 * `meta.courseTimeline` entries, normalised. Admin-authored rows use `timeLine` /
 * `mileStone`; a few older rows use `date` / `milestone` / `label`. Rows missing
 * either half are dropped — a milestone with no date can't be placed, and one with
 * no label can't be rendered.
 */
export function readCourseTimeline(
  meta: Record<string, unknown>,
): Array<RawTimelineMilestone> {
  return arr<unknown>(meta.courseTimeline)
    .map((entry) => {
      const item = asRecord(entry)
      return {
        date: str(item.timeLine ?? item.date ?? item.timeline),
        label: str(item.mileStone ?? item.milestone ?? item.label),
      }
    })
    .filter((item) => item.date !== '' && item.label !== '')
}

/**
 * Program progress as the share of the program's calendar that has elapsed:
 * `(now − firstMilestone) / (lastMilestone − firstMilestone)`, clamped to 0–100.
 *
 * This is the legacy LMS listing formula, kept deliberately (see
 * `docs/my-courses-listing-migration.md` §7) so the migrated page reports the same
 * number students already know. Returns 0 when there is nothing to measure: no
 * milestones, only unparseable dates, or every milestone on the same instant
 * (a zero-length program has no meaningful "percent elapsed").
 */
export function computeCourseProgress(
  milestones: Array<RawTimelineMilestone>,
  now: number = Date.now(),
): number {
  const timestamps = milestones
    .map((m) => new Date(m.date).getTime())
    .filter((ts) => !Number.isNaN(ts))
    .sort((a, b) => a - b)

  if (timestamps.length === 0) return 0

  const start = timestamps[0]
  const end = timestamps[timestamps.length - 1]
  const span = end - start
  if (span <= 0) return 0

  return Math.max(0, Math.min(100, Math.round(((now - start) / span) * 100)))
}
