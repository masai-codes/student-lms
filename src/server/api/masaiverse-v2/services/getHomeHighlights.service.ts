import { and, desc, gte, isNull, lt, or } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { getLastWeekRangeIst, toMysqlUtc } from '@/lib/dateRanges'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

/** Max recap cards shown in the home "Last Week's Highlights" section. */
const HIGHLIGHTS_LIMIT = 6

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
 * Section 3 — recaps of events that happened last IST week, community-wide,
 * most recent first. An event "happened last week" when it ended within last
 * week's window, or (with no end time) started within it.
 */
export async function getHomeHighlights(
  now: Date,
): Promise<Array<MasaiverseV2HomeHighlight>> {
  const { start, end } = getLastWeekRangeIst(now)
  const startUtc = toMysqlUtc(start)
  const endUtc = toMysqlUtc(end)

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      meta: events.meta,
      startTime: events.startTime,
    })
    .from(events)
    .where(
      or(
        and(gte(events.endTime, startUtc), lt(events.endTime, endUtc)),
        and(
          isNull(events.endTime),
          gte(events.startTime, startUtc),
          lt(events.startTime, endUtc),
        ),
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
