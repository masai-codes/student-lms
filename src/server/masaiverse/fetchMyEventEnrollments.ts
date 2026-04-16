import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { eventEnrollments } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

export const fetchMyEventEnrollments = createServerFn({ method: 'GET' }).handler(
  fetchMyEventEnrollmentsHandler,
)

export async function fetchMyEventEnrollmentsHandler() {
  const userId = await getCurrentSessionUserId()
  if (!userId) return []

  const rows = await db
    .select({ eventId: eventEnrollments.eventId })
    .from(eventEnrollments)
    .where(eq(eventEnrollments.userId, userId))

  return rows
    .map((row) => row.eventId)
    .filter((eventId): eventId is NonNullable<typeof eventId> => eventId != null)
    .map((eventId) => String(eventId))
}
