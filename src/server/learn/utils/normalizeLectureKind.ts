import type { LectureKind } from '@/server/learn/lectureDetailTypes'

/** Maps DB `lectures.type` to the live/video kinds used by detail + support snapshots. */
export function normalizeLectureKind(type: string): LectureKind | null {
  const normalized = type.trim().toLowerCase()
  // `scrum` is a live-class variant (Zoom join + optional recording), mirroring
  // listing/dashboard `('live','scrum')` grouping and legacy LMS `is_live`.
  if (normalized === 'live' || normalized === 'scrum') {
    return 'live'
  }
  if (normalized === 'video') {
    return 'video'
  }
  return null
}
