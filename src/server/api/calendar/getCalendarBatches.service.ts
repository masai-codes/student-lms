import type { CalendarBatchesResponse } from './calendarTypes'
import { getEnrolledBatchesForUser } from '@/server/learn/services/getEnrolledBatches.service'

/**
 * The user's enrolled batches as `{ id, name }` options for the calendar's
 * batch filter — a thin projection of the learn dropdown source (newest
 * enrolment first).
 */
export async function getCalendarBatches(
  userId: number,
): Promise<CalendarBatchesResponse> {
  const batches = await getEnrolledBatchesForUser(userId)
  return {
    batches: batches.map((batch) => ({
      id: batch.batchId,
      name: batch.courseTitle,
    })),
  }
}
