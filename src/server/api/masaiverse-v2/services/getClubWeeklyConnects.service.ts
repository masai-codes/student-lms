import { and, asc } from 'drizzle-orm'
import { eventScopeConditions } from './eventScope'
import { publishedEventCondition } from './publishVisibility'
import { db } from '@/db'
import { events } from '@/db/schema'
import { parseMasaiverseEventDbTimestamp } from '@/utils/timeZoneHandler'

/** Max weekly-connect rows shown on the club page. */
const WEEKLY_CONNECTS_LIMIT = 20

export interface MasaiverseV2WeeklyConnect {
  id: string
  title: string
  /** `events.meta.belowTitle` — the supporting line under the title. */
  subtitle: string | null
  /** UTC ISO timestamps so the client derives the IST day badge + live state. */
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
 * Weekly Connects for a club — every event (past, live, or upcoming) that
 * belongs to the club and carries `meta.isWeeklyConnect === true`, ordered by
 * start time. The client derives each row's status from the timestamps.
 */
export async function getClubWeeklyConnects(
  clubId: number,
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2WeeklyConnect>> {
  if (!Number.isFinite(clubId)) return []

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      meta: events.meta,
      startTime: events.startTime,
      endTime: events.endTime,
    })
    .from(events)
    .where(
      and(
        ...eventScopeConditions({ clubId, weeklyConnect: 'only' }),
        publishedEventCondition(canSeeUnpublished),
      ),
    )
    .orderBy(asc(events.startTime))
    .limit(WEEKLY_CONNECTS_LIMIT)

  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    subtitle: toStringOrNull(row.meta?.belowTitle),
    startTime: toUtcIso(row.startTime),
    endTime: toUtcIso(row.endTime),
  }))
}
