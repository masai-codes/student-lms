import type { VideoLecturePhase } from '@/server/learn/lectureDetailTypes'
import { parseIstToMs } from '@/server/time/istClock'

export function resolveVideoLecturePhase(input: {
  schedule: string | null
  nowMs: number
}): VideoLecturePhase {
  const scheduleMs = parseIstToMs(input.schedule)
  if (scheduleMs == null) {
    return 'during_after'
  }

  // Video lectures become visible exactly at the scheduled start time (matches
  // legacy LMS). Unlike live lectures, there is no early join window.
  return input.nowMs < scheduleMs ? 'before' : 'during_after'
}
