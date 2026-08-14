/**
 * Seasonal window for the Independence Day navbar dressing (tiranga washes,
 * ribbon — see `IndependenceDayDecor`). Purely date-driven:
 * shows from the eve of Aug 15, 2026 and disappears on its own at
 * 11:00 AM IST on Aug 16, 2026 — no env flag, no redeploy to turn it off.
 * Offsets are written as `+05:30` (IST has no DST) so the window is the same
 * instant regardless of server/client timezone.
 */
const WINDOW_START_MS = Date.parse('2026-08-14T00:00:00+05:30')
const WINDOW_END_MS = Date.parse('2026-08-16T11:00:00+05:30')

export function isIndependenceDayUiEnabled(now: number = Date.now()): boolean {
  return now >= WINDOW_START_MS && now < WINDOW_END_MS
}
