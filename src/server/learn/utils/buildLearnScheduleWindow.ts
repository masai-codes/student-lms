import type {
  LearnSchedulePhaseFilter,
  LearningType,
} from '@/server/learn/types'
import {
  IST_OFFSET_MS,
  LECTURE_LISTING_LOOKAHEAD_MS,
} from '@/server/learn/utils/learnListingConstants'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Inclusive `gte` / exclusive `lt` bounds applied to `schedule`.
 * Values are MySQL `datetime` strings (UTC, `YYYY-MM-DD HH:mm:ss`) so they compare
 * directly against the `datetime({ mode: 'string' })` columns. `null` = unbounded.
 */
export interface LearnScheduleWindow {
  gte: string | null
  lt: string | null
}

export interface BuildLearnScheduleWindowInput {
  learningType: LearningType
  schedulePhase?: LearnSchedulePhaseFilter
  /** `yyyy-mm-dd` (inclusive lower bound). */
  scheduleStartDate?: string
  /** `yyyy-mm-dd` (inclusive upper bound, capped at today — legacy LMS). */
  scheduleEndDate?: string
  nowMs: number
}

function toMysqlUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
}

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS
}

/** Parse `yyyy-mm-dd` to the UTC start-of-day instant; `null` when malformed. */
function ymdToUtcStartOfDay(ymd: string | undefined): number | null {
  if (ymd == null) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return null
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** End of today (IST) as a UTC instant — legacy assignment visibility cutoff. */
function istEndOfTodayUtcMs(nowMs: number): number {
  const istNow = nowMs + IST_OFFSET_MS
  const istNextMidnight = startOfUtcDay(istNow) + DAY_MS
  return istNextMidnight - IST_OFFSET_MS
}

/** Date-range bounds with the upper bound capped at "today" (legacy LMS). */
function buildDateRangeWindow(
  startMs: number,
  endYmd: string | undefined,
  nowMs: number,
): LearnScheduleWindow {
  const todayStart = startOfUtcDay(nowMs)
  const requestedEnd = ymdToUtcStartOfDay(endYmd) ?? todayStart
  const cappedEnd = Math.min(requestedEnd, todayStart)
  return { gte: toMysqlUtc(startMs), lt: toMysqlUtc(cappedEnd + DAY_MS) }
}

/**
 * Resolves the `schedule` window for a learn listing, mirroring legacy LMS visibility:
 * - Lectures/resources: "upcoming" → [now, now+24h); "past" → (−∞, now); default → (−∞, now+24h).
 *   A date range (when present, and not "upcoming") overrides with its capped bounds.
 * - Assignments: date range when present, otherwise (−∞, end-of-today-IST).
 */
export function buildLearnScheduleWindow(
  input: BuildLearnScheduleWindowInput,
): LearnScheduleWindow {
  const {
    learningType,
    schedulePhase,
    scheduleStartDate,
    scheduleEndDate,
    nowMs,
  } = input
  const startMs = ymdToUtcStartOfDay(scheduleStartDate)

  if (learningType === 'assignment') {
    if (startMs != null) {
      return buildDateRangeWindow(startMs, scheduleEndDate, nowMs)
    }
    return { gte: null, lt: toMysqlUtc(istEndOfTodayUtcMs(nowMs)) }
  }

  if (schedulePhase === 'upcoming') {
    return {
      gte: toMysqlUtc(nowMs),
      lt: toMysqlUtc(nowMs + LECTURE_LISTING_LOOKAHEAD_MS),
    }
  }

  if (startMs != null) {
    return buildDateRangeWindow(startMs, scheduleEndDate, nowMs)
  }

  if (schedulePhase === 'past') {
    return { gte: null, lt: toMysqlUtc(nowMs) }
  }

  return { gte: null, lt: toMysqlUtc(nowMs + LECTURE_LISTING_LOOKAHEAD_MS) }
}
