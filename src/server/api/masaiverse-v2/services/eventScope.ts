import { eq, inArray, isNull, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { events } from '@/db/schema'

/** Optional filters shared by the event-listing services. */
export interface MasaiverseEventScope {
  /** Restrict to a single club's events (`events.club_id`). */
  clubId?: number
  /** Restrict to public events only — those with no club (`club_id IS NULL`). */
  publicOnly?: boolean
  /**
   * Member-visibility filter: keep public events (no club) *plus* the events of
   * the listed clubs. An empty array means public events only. Omit the field
   * entirely to skip this filter. This is how a member sees community events
   * plus the events of clubs they've actually joined.
   */
  visibleClubIds?: Array<number>
  /**
   * Weekly-connect filter on `events.meta.isWeeklyConnect`:
   * - `only`: the flag is exactly `true`
   * - `exclude`: the flag is `false` or absent
   */
  weeklyConnect?: 'only' | 'exclude'
}

const isWeeklyConnect = sql`json_extract(${events.meta}, '$.isWeeklyConnect') = true`
const notWeeklyConnect = sql`(json_extract(${events.meta}, '$.isWeeklyConnect') is null or json_extract(${events.meta}, '$.isWeeklyConnect') <> true)`

/**
 * Builds the extra WHERE conditions for a club/weekly-connect scoped event
 * query, so the home and club listings can share one query body. Returns an
 * empty array for an unscoped (community-wide) listing.
 */
export function eventScopeConditions(
  scope: MasaiverseEventScope = {},
): Array<SQL> {
  const conditions: Array<SQL> = []
  if (scope.clubId != null && Number.isFinite(scope.clubId)) {
    conditions.push(eq(events.clubId, scope.clubId))
  }
  if (scope.publicOnly) conditions.push(isNull(events.clubId))
  if (scope.visibleClubIds != null) {
    const ids = scope.visibleClubIds.filter((id) => Number.isFinite(id))
    conditions.push(
      ids.length > 0
        ? (or(isNull(events.clubId), inArray(events.clubId, ids)) as SQL)
        : isNull(events.clubId),
    )
  }
  if (scope.weeklyConnect === 'only') conditions.push(isWeeklyConnect)
  if (scope.weeklyConnect === 'exclude') conditions.push(notWeeklyConnect)
  return conditions
}
