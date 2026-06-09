import { and, count, eq } from 'drizzle-orm'
import { awardEventRegistrationPoints } from './awardLeaderboardPoints.service'
import { db } from '@/db'
import { ApiError } from '@/server/api/http/apiError'
import { eventEnrollments, events } from '@/db/schema'

export interface EventEnrollmentState {
  isEnrolled: boolean
  /** Live count of rows in `event_enrollments` after the (idempotent) insert. */
  enrolledCount: number
  /**
   * Where to send the user after registering: the join URL for online events
   * (`events.event_link`) or the directions URL for offline ones
   * (`events.location_map_link`). Null when the relevant link is unset.
   */
  redirectUrl: string | null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function getEnrolledCount(eventId: number): Promise<number> {
  const [{ enrolledCount }] = await db
    .select({ enrolledCount: count() })
    .from(eventEnrollments)
    .where(eq(eventEnrollments.eventId, eventId))
  return enrolledCount
}

/**
 * Registers the user for an event and resolves with the resulting enrollment
 * state, the live attendee count, and the post-registration redirect target.
 * Registering is idempotent — the `(user_id, event_id)` unique index makes a
 * duplicate insert a no-op so repeated calls converge on "enrolled".
 */
export async function setEventEnrollment(
  userId: number,
  eventId: number,
): Promise<EventEnrollmentState> {
  if (!Number.isFinite(eventId)) {
    throw new ApiError(400, 'INVALID_EVENT_ID')
  }

  const event = (
    await db
      .select({
        id: events.id,
        mode: events.mode,
        eventLink: events.eventLink,
        locationMapLink: events.locationMapLink,
        clubId: events.clubId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
  ).at(0)
  if (!event) {
    throw new ApiError(404, 'EVENT_NOT_FOUND')
  }

  // Whether they were already enrolled decides if registration points are due:
  // re-registering is a no-op and must not award twice.
  const alreadyEnrolled =
    (
      await db
        .select({ userId: eventEnrollments.userId })
        .from(eventEnrollments)
        .where(
          and(
            eq(eventEnrollments.userId, userId),
            eq(eventEnrollments.eventId, eventId),
          ),
        )
        .limit(1)
    ).length > 0

  // The (user_id, event_id) unique index makes re-registering a no-op.
  await db
    .insert(eventEnrollments)
    .values({ userId, eventId })
    .onDuplicateKeyUpdate({ set: { eventId } })

  // First-time registration earns event-registration points (club id rides along).
  if (!alreadyEnrolled) {
    await awardEventRegistrationPoints({
      userId,
      eventId,
      clubId: event.clubId ?? null,
    })
  }

  const redirectUrl =
    event.mode === 'offline'
      ? toStringOrNull(event.locationMapLink)
      : toStringOrNull(event.eventLink)

  return {
    isEnrolled: true,
    enrolledCount: await getEnrolledCount(eventId),
    redirectUrl,
  }
}
