import { and, count, eq } from 'drizzle-orm'
import { publishedEventCondition } from './publishVisibility'
import type { EventStatus } from '@/lib/masaiverseEventCard'
import { db } from '@/db'
import { clubMembers, clubs, eventEnrollments, events } from '@/db/schema'
import { parseMasaiverseEventDbTimestamp } from '@/utils/timeZoneHandler'
import { getEventStatus } from '@/lib/masaiverseEventCard'
import { readEnrollmentRating } from '@/server/api/masaiverse-v2/services/rateEvent.service'

/** Free-form `events.category` string (e.g. "hackathon", "offline_meetup"). */
export type EventCategory = string
export type EventMode = 'online' | 'offline'

export interface EventHost {
  /** Host display name. */
  name: string
  /** Host avatar URL; null when none is set. */
  imageUrl: string | null
}

export interface MasaiverseV2EventDetail {
  id: string
  title: string
  /** `events.description` — long-form blurb shown in the "About" section. */
  description: string | null
  /** `events.image_link` — hero banner; null when none is set. */
  imageUrl: string | null
  category: EventCategory | null
  /** `events.mode` — drives whether registration redirects to a link or a map. */
  mode: EventMode | null
  /** `events.event_link` — online join URL (used when `mode === 'online'`). */
  eventLink: string | null
  locationTitle: string | null
  /** `events.location_map_link` — directions URL (used when `mode === 'offline'`). */
  locationMapLink: string | null
  /** `events.platform` — e.g. "Zoom", "Google Meet"; shown for online events. */
  platform: string | null
  /** UTC ISO timestamps so the client formats in IST and derives the live state. */
  startTime: string | null
  endTime: string | null
  /** `events.meta.aboveTitle` — small eyebrow label above the title. */
  aboveTitle: string | null
  /** `events.meta.belowTitle` — supporting line under the title. */
  belowTitle: string | null
  /** `events.meta.isWeeklyConnect` — marks recurring weekly-connect sessions. */
  isWeeklyConnect: boolean
  /**
   * `events.meta.confirmationModalText` — markdown shown in a confirm dialog
   * before registering. Null when unset, in which case registration is direct.
   */
  confirmationModalText: string | null
  /**
   * `events.meta.eventSummary` — markdown/HTML recap shown above the "About"
   * section once the event has ended. Null when unset.
   */
  eventSummary: string | null
  clubId: string | null
  /** Hosting club name (via join); null for community-wide events. */
  clubName: string | null
  /**
   * Whether the requesting user is a member of the hosting club. Registration
   * is gated behind club membership, so the event page shows a "Join club" CTA
   * instead of "Register" when this is false. Always true for community-wide
   * events (no club to join).
   */
  isClubMember: boolean
  /**
   * The hosting club's `meta.confirmationModalText` — markdown shown in a
   * confirm dialog before joining the club from the event page. Null when the
   * club sets none, or for community-wide events.
   */
  clubConfirmationModalText: string | null
  /** `events.meta.hostedBy` — named hosts (with optional avatars) for the event. */
  hostedBy: Array<EventHost>
  /** Lifecycle status derived from the timestamps (live / upcoming / completed). */
  status: EventStatus
  /** Whether the requesting user has already registered. */
  isEnrolled: boolean
  /** Live count of rows in `event_enrollments` for this event. */
  enrolledCount: number
  /** The 1–5 rating the user already gave this (ended) event; null if unrated. */
  userRating: number | null
  /** The optional feedback the user left with their rating; null when none. */
  userFeedback: string | null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toUtcIso(value: string | null): string | null {
  return parseMasaiverseEventDbTimestamp(value)?.toISOString() ?? null
}

/**
 * Coerces `meta.hostedBy` into a clean `{ name, imageUrl }` list, dropping any
 * entry without a non-empty host name. Blank/absent avatars become null.
 */
function toHostedBy(value: unknown): Array<EventHost> {
  if (!Array.isArray(value)) return []
  return value
    .map((entry): EventHost | null => {
      if (typeof entry !== 'object' || entry === null) return null
      const record = entry as Record<string, unknown>
      const name = toStringOrNull(record.host)
      return name ? { name, imageUrl: toStringOrNull(record.imageUrl) } : null
    })
    .filter((entry): entry is EventHost => entry !== null)
}

/**
 * Full detail for a single event's Luma-style registration page. Returns `null`
 * when no event matches the id so the route can render a "not found" state. The
 * hosting club name is joined in, and `isEnrolled` / `enrolledCount` are derived
 * live from `event_enrollments`.
 */
export async function getEventDetail(
  eventId: number,
  userId: number,
  now: Date = new Date(),
  canSeeUnpublished = false,
): Promise<MasaiverseV2EventDetail | null> {
  if (!Number.isFinite(eventId)) return null

  const row = (
    await db
      .select({
        id: events.id,
        clubId: events.clubId,
        title: events.title,
        description: events.description,
        category: events.category,
        mode: events.mode,
        locationTitle: events.locationTitle,
        locationMapLink: events.locationMapLink,
        eventLink: events.eventLink,
        imageLink: events.imageLink,
        platform: events.platform,
        startTime: events.startTime,
        endTime: events.endTime,
        meta: events.meta,
        clubName: clubs.name,
        clubMeta: clubs.meta,
      })
      .from(events)
      .leftJoin(clubs, eq(events.clubId, clubs.id))
      .where(
        and(eq(events.id, eventId), publishedEventCondition(canSeeUnpublished)),
      )
      .limit(1)
  ).at(0)

  if (!row) return null

  const [{ enrolledCount }] = await db
    .select({ enrolledCount: count() })
    .from(eventEnrollments)
    .where(eq(eventEnrollments.eventId, eventId))

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
  const isEnrolled = enrollment != null
  const rating = readEnrollmentRating(enrollment?.meta)

  // Registration is members-only, so the event page needs to know whether the
  // viewer belongs to the hosting club. Community-wide events (no club) have
  // nothing to join, so they're treated as "member" and register directly.
  const isClubMember =
    row.clubId == null
      ? true
      : (
          await db
            .select({ id: clubMembers.id })
            .from(clubMembers)
            .where(
              and(
                eq(clubMembers.clubId, row.clubId),
                eq(clubMembers.userId, userId),
              ),
            )
            .limit(1)
        ).length > 0

  const startTime = toUtcIso(row.startTime)
  const endTime = toUtcIso(row.endTime)

  return {
    id: String(row.id),
    title: row.title,
    description: toStringOrNull(row.description),
    imageUrl: toStringOrNull(row.imageLink),
    category: row.category ?? null,
    mode: row.mode ?? null,
    eventLink: toStringOrNull(row.eventLink),
    locationTitle: toStringOrNull(row.locationTitle),
    locationMapLink: toStringOrNull(row.locationMapLink),
    platform: toStringOrNull(row.platform),
    startTime,
    endTime,
    aboveTitle: toStringOrNull(row.meta?.aboveTitle),
    belowTitle: toStringOrNull(row.meta?.belowTitle),
    isWeeklyConnect: row.meta?.isWeeklyConnect === true,
    confirmationModalText: toStringOrNull(row.meta?.confirmationModalText),
    eventSummary: toStringOrNull(row.meta?.eventSummary),
    clubId: row.clubId != null ? String(row.clubId) : null,
    clubName: toStringOrNull(row.clubName),
    isClubMember,
    clubConfirmationModalText: toStringOrNull(
      row.clubMeta?.confirmationModalText,
    ),
    hostedBy: toHostedBy(row.meta?.hostedBy),
    status: getEventStatus({ startTime, endTime }, now),
    isEnrolled,
    enrolledCount,
    userRating: rating?.rating ?? null,
    userFeedback: rating?.feedback ?? null,
  }
}
