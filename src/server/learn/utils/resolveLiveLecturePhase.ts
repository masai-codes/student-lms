import type { LiveLecturePhase } from '@/server/learn/lectureDetailTypes'
import { JOIN_UI_VISIBLE_MINUTES_BEFORE_START } from '@/server/learn/utils/lectureScheduleConstants'
import { parseIstToMs } from '@/server/time/istClock'

export function resolveLiveLecturePhase(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
}): LiveLecturePhase {
  const scheduleMs = parseIstToMs(input.schedule)
  const concludesMs = parseIstToMs(input.concludes)

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
