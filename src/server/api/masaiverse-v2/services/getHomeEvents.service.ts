import { and, asc, eq, gte, inArray, isNull, or } from 'drizzle-orm'
import { eventScopeConditions } from './eventScope'
import { publishedEventCondition } from './publishVisibility'
import type { MasaiverseEventScope } from './eventScope'
import { db } from '@/db'
import { eventEnrollments, events } from '@/db/schema'
import { toMysqlUtc } from '@/lib/dateRanges'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

/** Max events shown in the home "Live & Upcoming" carousel. */
const HOME_EVENTS_LIMIT = 20

export interface MasaiverseV2HomeEvent {
  id: string
  /** `events.image_link` — banner image; null when none is set. */
  imageUrl: string | null
  /** `events.meta.aboveTitle` — small label above the title. */
  aboveTitle: string | null
  title: string
  /** `events.meta.belowTitle` — supporting line under the title. */
  belowTitle: string | null
  /** UTC ISO timestamps so the client formats in IST and derives the live state. */
  startTime: string | null
  endTime: string | null
  /** Whether the requesting user has already registered for this event. */
  isEnrolled: boolean
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toUtcIso(value: string | null): string | null {
  return parseMasaiverseEventDbTimestamp(value)?.toISOString() ?? null
}

/** The subset of `eventIds` the user is registered for, as a fast lookup set. */
async function fetchEnrolledEventIds(
  userId: number,
  eventIds: Array<number>,
): Promise<Set<number>> {
  if (eventIds.length === 0) return new Set()
  const rows = await db
    .select({ eventId: eventEnrollments.eventId })
    .from(eventEnrollments)
    .where(
      and(
        eq(eventEnrollments.userId, userId),
        inArray(eventEnrollments.eventId, eventIds),
      ),
    )
  return new Set(rows.map((row) => row.eventId))
}

/**
 * Section 2 — live or upcoming events for the home page, community-wide
 * (both public and club events), soonest first. Ongoing events naturally sort
 * ahead of upcoming ones because their start time is already in the past.
 *
 * "Not ended" = the event has an end time still in the future, or has no end
 * time but starts in the future. Events with neither timestamp are excluded
 * since they can't be placed on the timeline.
 *
 * Pass a {@link MasaiverseEventScope} to reuse this for a single club's events
 * (e.g. the club page's upcoming/live section, weekly-connects excluded).
 *
 * Pass `userId` to mark which returned events the user has already registered
 * for (`isEnrolled`); omit it and every event reports `isEnrolled: false`.
 */
export async function getHomeEvents(
  now: Date,
  scope: MasaiverseEventScope = {},
  userId?: number,
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2HomeEvent>> {
  const nowUtc = toMysqlUtc(now)

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      imageLink: events.imageLink,
      meta: events.meta,
      startTime: events.startTime,
      endTime: events.endTime,
    })
    .from(events)
    .where(
      and(
        or(
          gte(events.endTime, nowUtc),
          and(isNull(events.endTime), gte(events.startTime, nowUtc)),
        ),
        ...eventScopeConditions(scope),
        publishedEventCondition(canSeeUnpublished),
      ),
    )
    .orderBy(asc(events.startTime))
    .limit(HOME_EVENTS_LIMIT)

  const enrolledIds =
    userId == null
      ? new Set<number>()
      : await fetchEnrolledEventIds(
          userId,
          rows.map((row) => row.id),
        )

  return rows.map((row) => ({
    id: String(row.id),
    imageUrl: toStringOrNull(row.imageLink),
    aboveTitle: toStringOrNull(row.meta?.aboveTitle),
    title: row.title,
    belowTitle: toStringOrNull(row.meta?.belowTitle),
    startTime: toUtcIso(row.startTime),
    endTime: toUtcIso(row.endTime),
    isEnrolled: enrolledIds.has(row.id),
  }))
}
