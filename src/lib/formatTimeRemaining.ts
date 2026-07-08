const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/**
 * Human "time remaining" label from a positive millisecond duration:
 * - `>= 1 day`  → "2 days remaining" (days only, no hours)
 * - `< 1 day`   → "3 hr 20 min remaining" (short hr/min units)
 * - `< 1 hour`  → "20 min remaining"
 *
 * Hours/minutes only surface once under a day, so far-out deadlines stay
 * readable while near ones get useful precision. Returns `null` for a
 * non-positive or non-finite duration (nothing left to count down).
 *
 * Shared by the assignment deadline (`concludes`) and lecture catch-up window
 * countdowns so both read identically.
 */
export function formatTimeRemaining(remainingMs: number): string | null {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null

  const days = Math.floor(remainingMs / DAY_MS)
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS)

  let parts: Array<string>
  if (days >= 1) {
    parts = [`${days} day${days === 1 ? '' : 's'}`]
  } else if (hours >= 1) {
    parts =
      minutes > 0 ? [`${hours} hr`, `${minutes} min`] : [`${hours} hr`]
  } else {
    // Under a minute still counts as "1 min" — never render "0 min".
    parts = [`${Math.max(1, minutes)} min`]
  }

  return `${parts.join(' ')} remaining`
}
