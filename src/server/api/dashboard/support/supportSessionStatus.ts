/**
 * Support-session presentation state, computed on the backend so the frontend
 * only renders. Previously the "is it live / is it today" decision lived in the
 * UI; it lives here now.
 *
 * All inputs are IST wall-clock `YYYY-MM-DD HH:MM:SS` strings, which compare
 * correctly with plain lexical `<=` (fixed width, zero-padded, same separator).
 */
export type SupportSessionStatus = 'live' | 'today' | 'upcoming'

export function resolveSupportSessionStatus(
  schedule: string | null,
  concludes: string | null,
  istNow: string,
): SupportSessionStatus {
  if (!schedule) return 'upcoming'

  const hasStarted = schedule <= istNow
  const hasNotEnded = concludes === null || istNow <= concludes
  if (hasStarted && hasNotEnded) return 'live'

  if (isSameIstDay(schedule, istNow)) return 'today'

  return 'upcoming'
}

/** Two IST wall-clock strings fall on the same calendar day. */
function isSameIstDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}
