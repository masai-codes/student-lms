import type { WatchIntervalSegment } from '@/server/video-attendance/types'

export function unwatchedGaps(
  merged: Array<WatchIntervalSegment>,
  totalDuration: number,
): Array<WatchIntervalSegment> {
  if (totalDuration <= 0 || merged.length === 0) {
    if (totalDuration > 0) return [{ start: 0, end: totalDuration }]
    return []
  }

  const gaps: Array<WatchIntervalSegment> = []
  let cursor = 0

  for (const segment of merged) {
    if (segment.start > cursor) {
      gaps.push({ start: cursor, end: Math.min(segment.start, totalDuration) })
    }
    cursor = Math.max(cursor, segment.end)
    if (cursor >= totalDuration) break
  }

  if (cursor < totalDuration) {
    gaps.push({ start: cursor, end: totalDuration })
  }

  return gaps.filter((gap) => gap.end > gap.start)
}
