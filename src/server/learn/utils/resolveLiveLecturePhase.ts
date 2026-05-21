import type { LiveLecturePhase } from '@/server/learn/lectureDetailTypes'
import { JOIN_UI_VISIBLE_MINUTES_BEFORE_START } from '@/server/learn/utils/lectureScheduleConstants'

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function resolveLiveLecturePhase(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
}): LiveLecturePhase {
  const scheduleMs = toTimestamp(input.schedule)
  const concludesMs = toTimestamp(input.concludes)

  if (scheduleMs == null) {
    return 'before'
  }

  const visibleFromMs =
    scheduleMs - JOIN_UI_VISIBLE_MINUTES_BEFORE_START * 60 * 1000

  if (input.nowMs < visibleFromMs) {
    return 'before'
  }

  if (concludesMs != null && input.nowMs > concludesMs) {
    return 'after'
  }

  if (input.nowMs >= visibleFromMs) {
    return 'during'
  }

  return 'before'
}
