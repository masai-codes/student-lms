import type { VideoLecturePhase } from '@/server/learn/lectureDetailTypes'
import { JOIN_UI_VISIBLE_MINUTES_BEFORE_START } from '@/server/learn/utils/lectureScheduleConstants'
import { parseIstToMs } from '@/server/time/istClock'

export function resolveVideoLecturePhase(input: {
  schedule: string | null
  nowMs: number
}): VideoLecturePhase {
  const scheduleMs = parseIstToMs(input.schedule)
  if (scheduleMs == null) {
    return 'during_after'
  }

  const visibleFromMs =
    scheduleMs - JOIN_UI_VISIBLE_MINUTES_BEFORE_START * 60 * 1000

  return input.nowMs < visibleFromMs ? 'before' : 'during_after'
}
