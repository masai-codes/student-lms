import { toEpochMs } from '@/db/columnTypes'

/** IST is a fixed UTC+05:30 (India has no DST). */
const IST_OFFSET_MIN = 5 * 60 + 30

/**
 * Sentinel cutoff used when a restriction flag is set but carries no (valid) date:
 * we treat it as "restrict everything scheduled". Every real schedule is after
 * epoch 0, so {@link isScheduledAfterCutoff} returns true for all scheduled content.
 */
export const RESTRICT_ALL_CUTOFF = ''

/**
 * Normalises an admin-entered IST restriction date to a comparable
 * `"YYYY-MM-DD HH:MM:SS"` cutoff string. A date-only value is pushed to end-of-day
 * so "scheduled after the date" excludes the date itself. Missing/invalid input
 * falls back to {@link RESTRICT_ALL_CUTOFF}.
 */
export function normalizeRestrictionCutoff(raw: unknown): string {
  if (typeof raw !== 'string') return RESTRICT_ALL_CUTOFF
  const value = raw.trim().replace('T', ' ')
  if (!value) return RESTRICT_ALL_CUTOFF

  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(value)
  if (dateOnly) return `${dateOnly[1]} 23:59:59`

  const dateTime = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?/.exec(value)
  if (dateTime) return `${dateTime[1]} ${dateTime[2]}${dateTime[3] ?? ':00'}`

  return value
}

/**
 * True when a content item's schedule is strictly after the restriction cutoff (so
 * it must be hidden/blocked). Items without a schedule are never "after" the cutoff.
 *
 * Comparison is epoch-based via {@link toEpochMs}: both a naive IST wall-clock string
 * ("2026-07-09 03:20:00") and an offset-stamped ISO string ("…+05:30", produced by
 * the `istDatetime` column type) resolve to the correct absolute instant, so this is
 * safe regardless of which datetime column convention the schedule came from.
 */
export function isScheduledAfterCutoff(
  schedule: string | null | undefined,
  cutoff: string,
): boolean {
  if (schedule == null || schedule === '') return false
  if (cutoff === RESTRICT_ALL_CUTOFF) return true
  return (
    toEpochMs(schedule, IST_OFFSET_MIN) > toEpochMs(cutoff, IST_OFFSET_MIN)
  )
}
