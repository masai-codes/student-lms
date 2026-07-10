/**
 * Support-session presentation state, computed on the backend so the frontend
 * only renders. Previously the "is it live / is it today" decision lived in the
 * UI; it lives here now.
 *
 * `schedule`/`concludes` arrive as offset-stamped IST ISO strings
 * (`YYYY-MM-DDTHH:MM:SS+05:30`) from the `istDatetime` column type, so we
 * compare absolute instants via `parseIstToMs` rather than lexically — the
 * `T`/space separator and the offset suffix make lexical `<=` unreliable.
 */
import { getIstNowSqlDatetime, parseIstToMs } from '@/server/time/istClock'

export type SupportSessionStatus = 'live' | 'today' | 'upcoming'

export function resolveSupportSessionStatus(
  schedule: string | null,
  concludes: string | null,
  now: Date,
): SupportSessionStatus {
  const scheduleMs = parseIstToMs(schedule)
  if (scheduleMs == null) return 'upcoming'

  const nowMs = now.getTime()
  const concludesMs = parseIstToMs(concludes)
  const hasStarted = scheduleMs <= nowMs
  const hasNotEnded = concludesMs == null || nowMs <= concludesMs
  if (hasStarted && hasNotEnded) return 'live'

  if (isSameIstDay(schedule, now)) return 'today'

  return 'upcoming'
}

/** The session's IST calendar day matches "today" in IST. */
function isSameIstDay(scheduleIso: string | null, now: Date): boolean {
  if (!scheduleIso) return false
  // Both are IST-based: the ISO string's date portion is already IST, and
  // getIstNowSqlDatetime yields today's IST date.
  return scheduleIso.slice(0, 10) === getIstNowSqlDatetime(now).slice(0, 10)
}
