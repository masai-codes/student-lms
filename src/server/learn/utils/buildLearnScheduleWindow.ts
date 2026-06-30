import type {
  LearnSchedulePhaseFilter,
  LearningType,
} from '@/server/learn/types'
import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'

const DAY_MS = 24 * 60 * 60 * 1000
/** 18:30 UTC — legacy assignment cutoff anchor (`experience-api`). */
const ASSIGNMENT_CUTOFF_OFFSET_MS = (18 * 60 + 30) * 60 * 1000

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

export function toMysqlUtc(ms: number): string {
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

/**
 * Legacy "now" used for the past / upcoming lecture windows. `experience-api`
 * compares `schedule` against `Date.now() + 5:30`, so we mirror that exactly.
 */
function legacyNowMs(nowMs: number): number {
  return nowMs + IST_OFFSET_MS
}

/** Next UTC midnight — legacy `tomorrow` boundary for the default lecture window. */
function endOfTodayUtcMs(nowMs: number): number {
  return startOfUtcDay(nowMs) + DAY_MS
}

/**
 * Legacy assignment visibility cutoff: today (or tomorrow once past 18:30 UTC) at
 * 18:30 UTC, then shifted +5:30 — mirrors `experience-api` `getAssignments`.
 */
function assignmentCutoffMs(nowMs: number): number {
  const today1830 = startOfUtcDay(nowMs) + ASSIGNMENT_CUTOFF_OFFSET_MS
  const base = nowMs >= today1830 ? today1830 + DAY_MS : today1830
  return base + IST_OFFSET_MS
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
 * - Lectures/resources: "upcoming" → [now+5:30, next-UTC-midnight); "past" → (−∞, now+5:30);
 *   default → (−∞, next-UTC-midnight). A date range (when present, and not "upcoming")
 *   overrides with its capped bounds.
 * - Assignments: date range when present, otherwise (−∞, legacy 18:30-UTC+5:30 cutoff).
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
    return { gte: null, lt: toMysqlUtc(assignmentCutoffMs(nowMs)) }
  }

  if (schedulePhase === 'upcoming') {
    return {
      gte: toMysqlUtc(legacyNowMs(nowMs)),
      lt: toMysqlUtc(endOfTodayUtcMs(nowMs)),
    }
  }

  if (startMs != null) {
    return buildDateRangeWindow(startMs, scheduleEndDate, nowMs)
  }

  if (schedulePhase === 'past') {
    return { gte: null, lt: toMysqlUtc(legacyNowMs(nowMs)) }
  }

  return { gte: null, lt: toMysqlUtc(endOfTodayUtcMs(nowMs)) }
}
