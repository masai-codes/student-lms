import { and, desc, isNull, lt, or } from 'drizzle-orm'
import { eventScopeConditions } from './eventScope'
import { publishedEventCondition } from './publishVisibility'
import type { MasaiverseEventScope } from './eventScope'
import { db } from '@/db'
import { events } from '@/db/schema'
import { toMysqlUtc } from '@/lib/dateRanges'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

/** Max recap cards shown in the home "Past Events" section. */
const HIGHLIGHTS_LIMIT = 20

export interface MasaiverseV2HomeHighlight {
  id: string
  /** `events.meta.aboveTitle` — small label above the title (same field as the event card). */
  aboveTitle: string | null
  title: string
  /** `events.meta.belowTitle` — supporting line under the title (same field as the event card). */
  belowTitle: string | null
  /** `events.meta.pastEventEmojiValue` — emoji shown on the recap card. */
  pastEventEmojiValue: string | null
  /** UTC ISO start time, so the client can show the IST date + time. */
  startTime: string | null
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
 * Section 3 — recaps of past events, community-wide, most recent first. An
 * event is "past" when it has already ended, or (with no end time) started in
 * the past. This is the complement of the live/upcoming set in
 * {@link getHomeEvents}; events with neither timestamp are excluded.
 *
 * Pass a {@link MasaiverseEventScope} to reuse this for a single club's past
 * events (e.g. the club page's past-events section, weekly-connects excluded).
 */
export async function getHomeHighlights(
  now: Date,
  scope: MasaiverseEventScope = {},
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2HomeHighlight>> {
  const nowUtc = toMysqlUtc(now)

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      meta: events.meta,
      startTime: events.startTime,
    })
    .from(events)
    .where(
      and(
        or(
          lt(events.endTime, nowUtc),
          and(isNull(events.endTime), lt(events.startTime, nowUtc)),
        ),
        ...eventScopeConditions(scope),
        publishedEventCondition(canSeeUnpublished),
      ),
    )
    .orderBy(desc(events.endTime), desc(events.startTime))
    .limit(HIGHLIGHTS_LIMIT)

  return rows.map((row) => ({
    id: String(row.id),
    aboveTitle: toStringOrNull(row.meta?.aboveTitle),
    title: row.title,
    belowTitle: toStringOrNull(row.meta?.belowTitle),
    pastEventEmojiValue: toStringOrNull(row.meta?.pastEventEmojiValue),
    startTime: toUtcIso(row.startTime),
  }))
}
