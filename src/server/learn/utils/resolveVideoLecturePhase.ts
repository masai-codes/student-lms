import type { VideoLecturePhase } from '@/server/learn/lectureDetailTypes'
import { JOIN_UI_VISIBLE_MINUTES_BEFORE_START } from '@/server/learn/utils/lectureScheduleConstants'

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function resolveVideoLecturePhase(input: {
  schedule: string | null
  nowMs: number
}): VideoLecturePhase {
  const scheduleMs = toTimestamp(input.schedule)
  if (scheduleMs == null) {
    return 'during_after'
  }

  const visibleFromMs =
    scheduleMs - JOIN_UI_VISIBLE_MINUTES_BEFORE_START * 60 * 1000

  return input.nowMs < visibleFromMs ? 'before' : 'during_after'
}
