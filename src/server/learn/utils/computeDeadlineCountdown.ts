const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export interface DeadlineCountdown {
  /** Milliseconds until the deadline (always > 0 here). Used for urgency sort. */
  totalMs: number
  /** Display label: "N days remaining", or "N hours remaining" when < 1 day. */
  label: string
}

/**
 * Time remaining until an assignment deadline (`concludes`). Returns `null` when
 * there's no deadline or it has already passed (an overdue chip covers that).
 * Under a day, it counts down in hours. Mirrors the naive parse the rest of the
 * learn time logic uses (`new Date(value)` vs `nowMs`).
 */
export function computeDeadlineCountdown(
  concludes: string | null,
  nowMs: number,
): DeadlineCountdown | null {
  if (!concludes) return null
  const deadlineMs = new Date(concludes).getTime()
  if (Number.isNaN(deadlineMs)) return null

  const totalMs = deadlineMs - nowMs
  if (totalMs <= 0) return null

  const days = Math.floor(totalMs / DAY_MS)
  if (days >= 1) {
    return { totalMs, label: `${days} day${days === 1 ? '' : 's'} remaining` }
  }
  const hours = Math.max(1, Math.ceil(totalMs / HOUR_MS))
  return { totalMs, label: `${hours} hour${hours === 1 ? '' : 's'} remaining` }
}
