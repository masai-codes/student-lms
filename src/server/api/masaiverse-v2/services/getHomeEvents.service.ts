import { and, asc, gte, isNull, or } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { toMysqlUtc } from '@/lib/dateRanges'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

/** Max events shown in the home "This Week" section. */
const HOME_EVENTS_LIMIT = 8

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
 * Section 2 — live or upcoming events for the home page, community-wide
 * (both public and club events), soonest first. Ongoing events naturally sort
 * ahead of upcoming ones because their start time is already in the past.
 *
 * "Not ended" = the event has an end time still in the future, or has no end
 * time but starts in the future. Events with neither timestamp are excluded
 * since they can't be placed on the timeline.
 */
export async function getHomeEvents(
  now: Date,
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
      or(
        gte(events.endTime, nowUtc),
        and(isNull(events.endTime), gte(events.startTime, nowUtc)),
      ),
    )
    .orderBy(asc(events.startTime))
    .limit(HOME_EVENTS_LIMIT)

  return rows.map((row) => ({
    id: String(row.id),
    imageUrl: toStringOrNull(row.imageLink),
    aboveTitle: toStringOrNull(row.meta?.aboveTitle),
    title: row.title,
    belowTitle: toStringOrNull(row.meta?.belowTitle),
    startTime: toUtcIso(row.startTime),
    endTime: toUtcIso(row.endTime),
  }))
}
