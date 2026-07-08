import { formatTimeRemaining } from '@/lib/formatTimeRemaining'
import { parseIstToMs } from '@/server/time/istClock'

export interface DeadlineCountdown {
  /** Milliseconds until the deadline (always > 0 here). Used for urgency sort. */
  totalMs: number
  /** Display label, e.g. "2 days remaining" / "3 hr 20 min remaining". */
  label: string
}

/**
 * Time remaining until an assignment deadline (`concludes`). Returns `null` when
 * there's no deadline or it has already passed (an overdue chip covers that).
 * `concludes` is an IST wall-clock DB value, parsed to an absolute instant to
 * compare against `nowMs`. The label shows days/hours/minutes (see
 * {@link formatTimeRemaining}).
 */
export function computeDeadlineCountdown(
  concludes: string | null,
  nowMs: number,
): DeadlineCountdown | null {
  const deadlineMs = parseIstToMs(concludes)
  if (deadlineMs == null) return null

  const totalMs = deadlineMs - nowMs
  const label = formatTimeRemaining(totalMs)
  if (label == null) return null

  return { totalMs, label }
}
