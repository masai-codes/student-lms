import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { ApiError } from '@/server/api/http/apiError'
import { eventEnrollments, events } from '@/db/schema'
import { getEventStatus } from '@/lib/masaiverseEventCard'

export interface EventRatingState {
  /** The 1–5 score the user gave the event. */
  rating: number
  /** Optional free-text feedback; null when none was supplied. */
  feedback: string | null
}

/** Max length we persist for the optional feedback note. */
const MAX_FEEDBACK_LENGTH = 2000

function normalizeFeedback(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, MAX_FEEDBACK_LENGTH)
}

/** Reads a previously stored rating out of an enrollment's `meta`, if any. */
export function readEnrollmentRating(meta: unknown): EventRatingState | null {
  if (!meta || typeof meta !== 'object') return null
  const rating = (meta as Record<string, unknown>).rating
  if (typeof rating !== 'number' || !Number.isFinite(rating)) return null
  return { rating, feedback: normalizeFeedback((meta as Record<string, unknown>).feedback) }
}

/**
 * Records the user's rating (and optional feedback) for an event they attended.
 * A rating can only be submitted once — the second attempt throws
 * `ALREADY_RATED`. Rating is only allowed after the event has ended and only
 * for users who were registered.
 */
export async function rateEvent(
  userId: number,
  eventId: number,
  rating: number,
  feedback: unknown,
  now: Date = new Date(),
): Promise<EventRatingState> {
  if (!Number.isFinite(eventId)) {
    throw new ApiError(400, 'INVALID_EVENT_ID')
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'INVALID_RATING')
  }

  const event = (
    await db
      .select({
        id: events.id,
        startTime: events.startTime,
        endTime: events.endTime,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
  ).at(0)
  if (!event) {
    throw new ApiError(404, 'EVENT_NOT_FOUND')
  }
  if (getEventStatus(event, now) !== 'completed') {
    throw new ApiError(400, 'EVENT_NOT_ENDED')
  }

  const enrollment = (
    await db
      .select({ id: eventEnrollments.id, meta: eventEnrollments.meta })
      .from(eventEnrollments)
      .where(
        and(
          eq(eventEnrollments.eventId, eventId),
          eq(eventEnrollments.userId, userId),
        ),
      )
      .limit(1)
  ).at(0)
  if (!enrollment) {
    throw new ApiError(403, 'NOT_ENROLLED')
  }
  if (readEnrollmentRating(enrollment.meta)) {
    throw new ApiError(409, 'ALREADY_RATED')
  }

  const cleanFeedback = normalizeFeedback(feedback)
  await db
    .update(eventEnrollments)
    .set({
      meta: {
        ...(enrollment.meta ?? {}),
        rating,
        feedback: cleanFeedback,
        ratedAt: now.toISOString(),
      },
    })
    .where(eq(eventEnrollments.id, enrollment.id))

  return { rating, feedback: cleanFeedback }
}
