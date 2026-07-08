const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/**
 * Human "time remaining" label from a positive millisecond duration, showing
 * the two most-significant units down to minutes:
 * - `>= 1 day`  → "2 days 3 hours remaining" (drops trailing zero units)
 * - `< 1 day`   → "3 hours 20 minutes remaining"
 * - `< 1 hour`  → "20 minutes remaining"
 *
 * Minutes only surface once under a day, so far-out deadlines stay readable
 * while near ones get useful precision. Returns `null` for a non-positive or
 * non-finite duration (nothing left to count down).
 *
 * Shared by the assignment deadline (`concludes`) and lecture catch-up window
 * countdowns so both read identically.
 */
export function formatTimeRemaining(remainingMs: number): string | null {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null

  const days = Math.floor(remainingMs / DAY_MS)
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS)

  const unit = (value: number, name: string) =>
    `${value} ${name}${value === 1 ? '' : 's'}`

  let parts: Array<string>
  if (days >= 1) {
    parts = hours > 0 ? [unit(days, 'day'), unit(hours, 'hour')] : [unit(days, 'day')]
  } else if (hours >= 1) {
    parts =
      minutes > 0 ? [unit(hours, 'hour'), unit(minutes, 'minute')] : [unit(hours, 'hour')]
  } else {
    // Under a minute still counts as "1 minute" — never render "0 minutes".
    parts = [unit(Math.max(1, minutes), 'minute')]
  }

  return `${parts.join(' ')} remaining`
}
