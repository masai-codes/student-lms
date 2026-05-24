export type CatchUpWindow = {
  daysRemaining: number | null
  isCatchupWindowOver: boolean | null
}

function parseScheduleMs(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

function elapsedDaysSinceConcludes(concludesAtMs: number, nowMs: number): number {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(0, Math.floor((nowMs - concludesAtMs) / dayMs))
}

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

  const concludesMs =
    parseScheduleMs(input.concludes) ?? parseScheduleMs(input.schedule)
  if (concludesMs == null) {
    return { daysRemaining: null, isCatchupWindowOver: null }
  }

  const elapsedDays = elapsedDaysSinceConcludes(concludesMs, nowMs)
  const daysRemaining = Math.max(0, catchUpDays - elapsedDays)

  return {
    daysRemaining,
    isCatchupWindowOver: daysRemaining <= 0,
  }
}
