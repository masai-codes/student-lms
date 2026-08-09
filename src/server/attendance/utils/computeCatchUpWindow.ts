import { parseIstToMs } from '@/server/time/istClock'

export type CatchUpWindow = {
  daysRemaining: number | null
  isCatchupWindowOver: boolean | null
}

const DAY_MS = 24 * 60 * 60 * 1000

function elapsedDaysSinceConcludes(
  concludesAtMs: number,
  nowMs: number,
): number {
  return Math.max(0, Math.floor((nowMs - concludesAtMs) / DAY_MS))
}

/**
 * `daysRemaining` is a whole-day count — `catchUpDays` minus the number of full
 * days elapsed since the lecture concluded — matching the legacy LMS
 * (`experience-api` attendance resolver) so every surface shows the same number
 * it did there. Deliberately NOT a countdown to the exact window-close instant:
 * flooring the residual hours renders one day fewer for the same lecture.
 *
 * ⚠️ The `absent` learn-listing filter reproduces the window-over branch of this
 * logic in SQL for lectures with no attendance row — see
 * `buildAbsentWindowOverCondition`. Keep the two in sync.
 */
export function computeCatchUpWindow(input: {
  schedule: string | null
  concludes: string | null
  catchUpDays: number
  includeVideoAttendance: boolean
  isAbsent: boolean
  nowMs: number
}): CatchUpWindow {
  const { catchUpDays, includeVideoAttendance, isAbsent, nowMs } = input

  if (!isAbsent || !includeVideoAttendance || catchUpDays <= 0) {
    return { daysRemaining: null, isCatchupWindowOver: null }
  }

  // IST wall-clock DB values → absolute instant, independent of server tz.
  const concludesMs =
    parseIstToMs(input.concludes) ?? parseIstToMs(input.schedule)
  if (concludesMs == null) {
    return { daysRemaining: null, isCatchupWindowOver: null }
  }

  const elapsedDays = elapsedDaysSinceConcludes(concludesMs, nowMs)
  const daysRemaining = Math.max(0, catchUpDays - elapsedDays)

  return { daysRemaining, isCatchupWindowOver: daysRemaining <= 0 }
}
