import { and, asc, eq, inArray } from 'drizzle-orm'
import { eventScopeConditions } from './eventScope'
import { publishedEventCondition } from './publishVisibility'
import { getMemberClubIds } from './getMemberClubIds.service'
import { db } from '@/db'
import { clubs, eventEnrollments, events } from '@/db/schema'
import { parseMasaiverseEventDbTimestamp } from '@/utils/timeZoneHandler'

/** Free-form `events.category` string, surfaced to the client as a pill. */
type MasaiverseV2EventCategory = string
/** Allowed `events.mode` values. */
type MasaiverseV2EventMode = 'online' | 'offline'

/**
 * One row of the community-wide events listing. A superset of the home event
 * card shape ({@link MasaiverseV2HomeEvent}) with the extra bits the dedicated
 * events page needs to segregate public vs club events and label each card.
 */
export interface MasaiverseV2EventListItem {
  id: string
  /** `events.image_link` — banner image; null when none is set. */
  imageUrl: string | null
  /** `events.meta.aboveTitle` — small label above the title. */
  aboveTitle: string | null
  title: string
  /** `events.meta.belowTitle` — supporting line under the title. */
  belowTitle: string | null
  category: MasaiverseV2EventCategory | null
  mode: MasaiverseV2EventMode | null
  /** `events.location_title` — venue name for offline events. */
  locationTitle: string | null
  /** Hosting club id, or null for a public (community-wide) event. */
  clubId: string | null
  /** Hosting club name, or null for a public event. */
  clubName: string | null
  /** UTC ISO timestamps so the client formats in IST and derives live state. */
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
 * Every community event the user is allowed to see — public (no club) events
 * plus the events of clubs they've joined — including weekly connects, for the
 * dedicated events page. Club events of clubs the user is *not* a member of are
 * excluded; the home and club pages show further curated subsets. In admin mode
 * (`canSeeUnpublished`) the membership scoping is dropped entirely, so every
 * event (public + every club's, including unpublished drafts) is returned.
 *
 * Returned ascending by start time so the natural order is "soonest first";
 * the client splits this into upcoming/past buckets and segregates public vs
 * club events, so the ordering here is only a stable starting point.
 *
 * Pass `userId` to scope to that member's clubs and to mark which events they
 * have already registered for (`isEnrolled`); omit it and only public events
 * are returned, each with `isEnrolled: false`.
 */
export async function getEventsList(
  userId?: number,
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2EventListItem>> {
  // Admin mode is a full view: no club-membership scoping, so every event
  // (public + every club's) is returned. Otherwise scope to public events plus
  // the clubs this user has joined.
  const scope = canSeeUnpublished
    ? {}
    : { visibleClubIds: userId == null ? [] : await getMemberClubIds(userId) }

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      imageLink: events.imageLink,
      category: events.category,
      mode: events.mode,
      locationTitle: events.locationTitle,
      meta: events.meta,
      clubId: events.clubId,
      clubName: clubs.name,
      startTime: events.startTime,
      endTime: events.endTime,
    })
    .from(events)
    .leftJoin(clubs, eq(events.clubId, clubs.id))
    .where(
      and(
        ...eventScopeConditions(scope),
        publishedEventCondition(canSeeUnpublished),
      ),
    )
    .orderBy(asc(events.startTime))

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
    category: row.category ?? null,
    mode: row.mode ?? null,
    locationTitle: toStringOrNull(row.locationTitle),
    clubId: row.clubId == null ? null : String(row.clubId),
    clubName: row.clubId == null ? null : toStringOrNull(row.clubName),
    startTime: toUtcIso(row.startTime),
    endTime: toUtcIso(row.endTime),
    isEnrolled: enrolledIds.has(row.id),
  }))
}
