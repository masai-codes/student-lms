import type { WatchIntervalSegment } from '@/server/video-attendance/types'

/**
 * Watched-interval math, ported 1:1 from experience-api
 * (`videoAttendanceController.ts`) so the natively-computed values match what
 * the legacy backend produced for the same input.
 */

/** Plain overlap merge (no gap tolerance, no clamp). */
export function mergeIntervals(
  intervals: Array<WatchIntervalSegment>,
): Array<WatchIntervalSegment> {
  if (intervals.length <= 1) return intervals

  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const merged: Array<WatchIntervalSegment> = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push({ ...current })
    }
  }

  return merged
}

/**
 * Sum of per-interval rounded percentages, capped at 100 — matches
 * experience-api exactly (it rounds each interval individually before summing).
 */
export function calculateVideoWatchDurationPercentage(
  mergedIntervals: Array<WatchIntervalSegment>,
  totalDuration: number,
): number {
  if (!(totalDuration > 0)) return 0

  let watchPercentage = 0
  for (const interval of mergedIntervals) {
    const intervalDuration = interval.end - interval.start
    watchPercentage += Math.round((intervalDuration / totalDuration) * 100)
  }

  return watchPercentage > 100 ? 100 : watchPercentage
}

/**
 * Merge sorted adjacent intervals when the gap between them is
 * <= mergeGapSeconds (default 2s smooths tracking noise; larger skips stay
 * visible as separate segments). Used for the intervals read endpoint.
 */
export function mergeIntervalsWithTolerance(
  intervals: unknown,
  mergeGapSeconds = 2,
): Array<WatchIntervalSegment> {
  if (!Array.isArray(intervals) || intervals.length === 0) return []

  const sanitized = intervals
    .map((i) => ({ start: Number(i?.start), end: Number(i?.end) }))
    .filter(
      (i) =>
        Number.isFinite(i.start) && Number.isFinite(i.end) && i.end >= i.start,
    )
    .sort((a, b) => a.start - b.start)

  if (sanitized.length === 0) return []

  const merged: Array<WatchIntervalSegment> = [{ ...sanitized[0] }]

  for (let i = 1; i < sanitized.length; i += 1) {
    const last = merged[merged.length - 1]
    const next = sanitized[i]
    if (next.start - last.end <= mergeGapSeconds) {
      last.end = Math.max(last.end, next.end)
    } else {
      merged.push({ ...next })
    }
  }

  return merged
}

/** Parse the JSON `intervals` column into a typed array (tolerant of shapes). */
export function parseStoredIntervals(
  raw: unknown,
): Array<WatchIntervalSegment> {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((i) => ({ start: Number(i?.start), end: Number(i?.end) }))
    .filter(
      (i) =>
        Number.isFinite(i.start) && Number.isFinite(i.end) && i.end >= i.start,
    )
}
