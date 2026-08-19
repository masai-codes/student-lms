import type { CalendarEventDto, CalendarEventsResponse } from './calendarTypes'
import type { CalendarWindow } from './calendarWindow'
import { buildCalendarEvent } from './buildCalendarEvent'
import { fetchCalendarAssignments } from './fetchCalendarAssignments.service'
import { fetchCalendarLectures } from './fetchCalendarLectures.service'
import { fetchCalendarQuizzes } from './fetchCalendarQuizzes.service'
import { padCalendarWindow } from './calendarWindow'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getBatchIdsForSections } from '@/server/batches/getBatchIdsForSections'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'
import { makePausedScheduleFilter } from '@/server/restrictions/enrollmentRestrictionScope'
import { parseIstToMs } from '@/server/time/istClock'

/**
 * All calendar events (lectures + assignments + quizzes) for the user's
 * enrolled sections in the visible window, merged and sorted soonest-first.
 *
 * Scope is always derived server-side from the session user — the optional
 * `batchId` can only narrow it to one of the user's own batches (an unknown
 * batch yields an empty result, never someone else's data; this fixes the old
 * LMS bug of trusting client-sent section ids). Enrolment-cancelled batches
 * and rows scheduled after a paused batch's cutoff are dropped, same as the
 * dashboard schedule feed.
 */
export async function getCalendarEvents(
  userId: number,
  window: CalendarWindow,
  batchId: number | null = null,
  now: Date = new Date(),
): Promise<CalendarEventsResponse> {
  const nowMs = now.getTime()

  const [allSectionIds, enrolledBatchIds, restrictions] = await Promise.all([
    getSectionIdsForUser(userId),
    getBatchIdsForEnrolledUser(userId),
    getUserBatchRestrictions(userId),
  ])

  const sectionToBatch = await getBatchIdsForSections(allSectionIds)

  let sectionIds = allSectionIds
  if (batchId != null) {
    if (!enrolledBatchIds.includes(batchId)) {
      return { range: { ...window }, events: [] }
    }
    sectionIds = allSectionIds.filter(
      (sectionId) => sectionToBatch.get(sectionId) === batchId,
    )
  }
  if (sectionIds.length === 0) return { range: { ...window }, events: [] }

  const padded = padCalendarWindow(window)
  const [lectureRows, assignmentRows, quizRows] = await Promise.all([
    fetchCalendarLectures(sectionIds, padded),
    fetchCalendarAssignments(sectionIds, padded),
    fetchCalendarQuizzes(sectionIds, padded),
  ])

  const keep =
    restrictions.size > 0
      ? makePausedScheduleFilter(restrictions, sectionToBatch)
      : () => true

  const events = [
    ...lectureRows
      .filter(keep)
      .map((row) => buildCalendarEvent({ row, type: 'lecture', nowMs })),
    ...assignmentRows
      .filter(keep)
      .map((row) => buildCalendarEvent({ row, type: 'assignment', nowMs })),
    ...quizRows
      .filter(keep)
      .map((row) => buildCalendarEvent({ row, type: 'quiz', nowMs })),
  ]
    .filter((event): event is CalendarEventDto => event !== null)
    .filter((event) => overlapsWindow(event, padded))
    .sort(bySoonestSchedule)

  return { range: { ...window }, events }
}

/**
 * Exact instant-level trim after the coarse (day-granular) SQL filter: keep
 * the event only if `[schedule, effectiveEnd]` intersects the padded window.
 */
function overlapsWindow(
  event: CalendarEventDto,
  padded: CalendarWindow,
): boolean {
  const startMs = parseIstToMs(event.schedule)
  const endMs = parseIstToMs(event.effectiveEnd)
  if (startMs == null || endMs == null) return false
  const windowStartMs = parseIstToMs(`${padded.start} 00:00:00`) as number
  const windowEndMs = parseIstToMs(`${padded.end} 23:59:59`) as number
  return startMs <= windowEndMs && endMs >= windowStartMs
}

function bySoonestSchedule(a: CalendarEventDto, b: CalendarEventDto): number {
  return (parseIstToMs(a.schedule) ?? 0) - (parseIstToMs(b.schedule) ?? 0)
}
