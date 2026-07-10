import type { DashboardSupportSession } from './getSupportSessions.service'
import { parseIstToMs } from '@/server/time/istClock'

/**
 * Picks the single support session the dashboard card should feature, from the
 * soonest-first list:
 *
 * - a **live** session (join-able now) always wins; otherwise
 * - the **soonest session that hasn't started yet** — which the card renders as
 *   "scheduled today" or "next (another day)" based on its own `status`.
 *
 * Past/ended sessions are ignored. Returns `null` when nothing qualifies (the
 * card is then hidden entirely).
 */
export function selectFeaturedSupportSession(
  sessions: Array<DashboardSupportSession>,
  now: Date,
): DashboardSupportSession | null {
  const live = sessions.find((session) => session.status === 'live')
  if (live) return live

  const nowMs = now.getTime()
  const nextUpcoming = sessions.find((session) => {
    const scheduleMs = parseIstToMs(session.schedule)
    return scheduleMs != null && scheduleMs > nowMs
  })

  return nextUpcoming ?? null
}
