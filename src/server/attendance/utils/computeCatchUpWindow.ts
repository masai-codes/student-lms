import { formatTimeRemaining } from '@/lib/formatTimeRemaining'
import { parseIstToMs } from '@/server/time/istClock'

export type CatchUpWindow = {
  daysRemaining: number | null
  isCatchupWindowOver: boolean | null
  /**
   * Granular "time left" label for the catch-up window, e.g.
   * "2 days 3 hours remaining". Null when the window is null/over.
   */
  remainingLabel: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

function elapsedDaysSinceConcludes(
  concludesAtMs: number,
  nowMs: number,
): number {
  return Math.max(0, Math.floor((nowMs - concludesAtMs) / DAY_MS))
}

/**
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
    return {
      daysRemaining: null,
      isCatchupWindowOver: null,
      remainingLabel: null,
    }
  }

  // IST wall-clock DB values → absolute instant, independent of server tz.
  const concludesMs =
    parseIstToMs(input.concludes) ?? parseIstToMs(input.schedule)
  if (concludesMs == null) {
    return {
      daysRemaining: null,
      isCatchupWindowOver: null,
      remainingLabel: null,
    }
  }

  const elapsedDays = elapsedDaysSinceConcludes(concludesMs, nowMs)
  const daysRemaining = Math.max(0, catchUpDays - elapsedDays)

  // The window closes `catchUpDays` after the lecture concludes; the label
  // counts down to that exact instant (days → hours → minutes).
  const windowEndMs = concludesMs + catchUpDays * DAY_MS
  const remainingLabel = formatTimeRemaining(windowEndMs - nowMs)

  return {
    daysRemaining,
    isCatchupWindowOver: daysRemaining <= 0,
    remainingLabel,
  }
}
