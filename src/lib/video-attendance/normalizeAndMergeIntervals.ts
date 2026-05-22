import type { WatchIntervalSegment } from '@/server/video-attendance/types'

function isValidSegment(segment: unknown): segment is WatchIntervalSegment {
  if (!segment || typeof segment !== 'object') return false
  const { start, end } = segment as WatchIntervalSegment
  return (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start
  )
}

function clampSegment(
  segment: WatchIntervalSegment,
  duration: number,
): WatchIntervalSegment | null {
  const start = Math.max(0, segment.start)
  const end = duration > 0 ? Math.min(segment.end, duration) : segment.end
  if (!(end > start)) return null
  return { start, end }
}

export function normalizeAndMergeIntervals(
  raw: unknown,
  totalDuration: number,
): Array<WatchIntervalSegment> {
  const list = Array.isArray(raw) ? raw.filter(isValidSegment) : []

  let prepared = list.map(segment => ({ start: segment.start, end: segment.end }))
  if (totalDuration > 0) {
    prepared = prepared
      .map(segment => clampSegment(segment, totalDuration))
      .filter(Boolean) as Array<WatchIntervalSegment>
  }

  if (prepared.length === 0) return []

  prepared.sort((a, b) => a.start - b.start)

  const merged: Array<WatchIntervalSegment> = []
  let current = { ...prepared[0] }

  for (let index = 1; index < prepared.length; index += 1) {
    const next = prepared[index]
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end)
    } else {
      merged.push(current)
      current = { ...next }
    }
  }
  merged.push(current)
  return merged
}
