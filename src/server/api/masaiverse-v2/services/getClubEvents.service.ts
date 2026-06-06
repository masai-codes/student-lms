import { eq } from 'drizzle-orm'
import { getClubWeeklyConnects } from './getClubWeeklyConnects.service'
import { getHomeEvents } from './getHomeEvents.service'
import { getHomeHighlights } from './getHomeHighlights.service'
import type { MasaiverseV2WeeklyConnect } from './getClubWeeklyConnects.service'
import type { MasaiverseV2HomeEvent } from './getHomeEvents.service'
import type { MasaiverseV2HomeHighlight } from './getHomeHighlights.service'
import { db } from '@/db'
import { clubs } from '@/db/schema'

/** Event sections for a single club's detail page. */
export interface MasaiverseV2ClubEvents {
  /** All `meta.isWeeklyConnect` events for the club (past/live/upcoming). */
  weeklyConnects: Array<MasaiverseV2WeeklyConnect>
  /** Live/upcoming non-weekly-connect events — reuses the home events shape. */
  upcoming: Array<MasaiverseV2HomeEvent>
  /** Last week's non-weekly-connect events — reuses the home highlights shape. */
  past: Array<MasaiverseV2HomeHighlight>
}

/**
 * Aggregates the club page's three event sections. Returns `null` when no club
 * matches the id so the route can render a "not found" state. Weekly connects
 * are listed in full; the other two sections reuse the home services scoped to
 * this club with weekly-connect events excluded.
 */
export async function getClubEvents(
  clubId: number,
  now: Date = new Date(),
): Promise<MasaiverseV2ClubEvents | null> {
  if (!Number.isFinite(clubId)) return null

  const club = (
    await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1)
  ).at(0)
  if (!club) return null

  const [weeklyConnects, upcoming, past] = await Promise.all([
    getClubWeeklyConnects(clubId),
    getHomeEvents(now, { clubId, weeklyConnect: 'exclude' }),
    getHomeHighlights(now, { clubId, weeklyConnect: 'exclude' }),
  ])

  return { weeklyConnects, upcoming, past }
}
