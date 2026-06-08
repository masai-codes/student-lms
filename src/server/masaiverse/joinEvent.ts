import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { eventEnrollments, events } from '@/db/schema'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

function parseEventId(value: string): number {
  const eventId = Number(String(value ?? '').trim())
  if (!Number.isFinite(eventId) || eventId <= 0) {
    throw new Error('INVALID_EVENT_ID')
  }
  return eventId
}

export const joinEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: { eventId: string }) => data)
  .handler(joinEventHandler)

export async function joinEventHandler({ data }: { data: { eventId: string } }) {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const eventId = parseEventId(data.eventId)

  const event = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event[0]) {
    throw new Error('EVENT_NOT_FOUND')
  }

  const existingEnrollment = await db
    .select({ id: eventEnrollments.id })
    .from(eventEnrollments)
    .where(and(eq(eventEnrollments.userId, userId), eq(eventEnrollments.eventId, eventId)))
    .limit(1)

  if (existingEnrollment[0]) {
    return {
      success: true,
      enrolledEventId: String(eventId),
      reason: 'ALREADY_ENROLLED',
    }
  }

  await db.insert(eventEnrollments).values({
    userId,
    eventId,
  })

  return {
    success: true,
    enrolledEventId: String(eventId),
    reason: 'ENROLLED',
  }
}
