import { ZOOM_LINK_VISIBLE_MINUTES_BEFORE_START } from '@/server/learn/utils/lectureScheduleConstants'
import { parseIstToMs } from '@/server/time/istClock'

/** Hide join link until shortly before the session (legacy lecture resolver behaviour). */
export function scrubZoomLinkForSchedule(input: {
  zoomLink: string | null
  schedule: string | null
  nowMs: number
}): string | null {
  const link = input.zoomLink?.trim()
  if (!link) return null

  const scheduleMs = parseIstToMs(input.schedule)
  if (scheduleMs == null) return link

  const revealFromMs =
    scheduleMs - ZOOM_LINK_VISIBLE_MINUTES_BEFORE_START * 60 * 1000

  return input.nowMs >= revealFromMs ? link : null
}
