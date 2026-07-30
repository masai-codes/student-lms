import { JOIN_UI_VISIBLE_MINUTES_AFTER_END } from '@/server/learn/utils/lectureScheduleConstants'
import { parseIstToMs } from '@/server/time/istClock'
import { isAdaptiveLectureLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'

/**
 * SAL (adaptive) recordings are hosted on the experience-api platform. Once
 * `concludes + 30 min` has passed we treat the recording as available — the same
 * post-conclude grace window used for live-phase transitions.
 */
export function isSalLectureRecordingAvailable(input: {
  zoomLink: string | null
  schedule: string | null
  concludes: string | null
  nowMs: number
}): boolean {
  if (!isAdaptiveLectureLink(input.zoomLink)) return false

  const scheduleMs = parseIstToMs(input.schedule)
  const concludesMs = parseIstToMs(input.concludes) ?? scheduleMs
  if (concludesMs == null) return false

  const availableFromMs =
    concludesMs + JOIN_UI_VISIBLE_MINUTES_AFTER_END * 60 * 1000
  return input.nowMs > availableFromMs
}
