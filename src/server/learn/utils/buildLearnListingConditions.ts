import {
  and,
  eq,
  exists,
  gte,
  inArray,
  isNull,
  like,
  lt,
  lte,
  ne,
  notExists,
  or,
  sql,
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AnyMySqlColumn } from 'drizzle-orm/mysql-core'

import type {
  BatchLearningFiltersInput,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import type { LearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'
import { db } from '@/db'
import { assignments, lectures, studentAttendances, users } from '@/db/schema'
import { buildAbsentWindowOverCondition } from '@/server/learn/utils/buildAbsentWindowOverCondition'
import { buildModuleFilterCondition } from '@/server/learn/utils/buildModuleFilterCondition'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import {
  DEFAULT_LECTURE_TYPES,
  LECTURE_RECENT_CONCLUDE_MS,
} from '@/server/learn/utils/learnListingConstants'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'

export interface LearnListingConditionsInput {
  learningType: LearningType
  batchId: number
  sectionIds: Array<number>
  userId: number
  filters?: BatchLearningFiltersInput
  window: LearnScheduleWindow
  search?: string
  nowMs: number
  /**
   * Normal-ban cutoff for this batch (normalised `"YYYY-MM-DD HH:MM:SS"`, or `''`
   * to restrict everything scheduled). When set, only items scheduled on/before it
   * (or with no schedule) are listed. Absent when the user isn't normal-banned here.
   */
  bannedScheduleCutoff?: string
}

function priorityToOptional(
  priorities: Array<LearningPriority>,
): Array<number> {
  return priorities.map((priority) => (priority === 'recommended' ? 1 : 0))
}

function scheduleConditions(
  scheduleColumn: AnyMySqlColumn,
  window: LearnScheduleWindow,
): Array<SQL> {
  const out: Array<SQL> = []
  if (window.gte != null) out.push(gte(scheduleColumn, window.gte))
  if (window.lt != null) out.push(lt(scheduleColumn, window.lt))
  return out
}

/**
 * Normal-ban schedule gate: keep only rows scheduled on/before the ban cutoff (plus
 * rows with no schedule). An empty cutoff means "restrict everything scheduled", so
 * only null-schedule rows survive. Returns `undefined` when no ban applies.
 */
function bannedScheduleCondition(
  scheduleColumn: AnyMySqlColumn,
  cutoff: string | undefined,
): SQL | undefined {
  if (cutoff == null) return undefined
  if (cutoff === '') return isNull(scheduleColumn)
  return or(isNull(scheduleColumn), lte(scheduleColumn, cutoff))
}

/**
 * Lecture type scope (legacy `experience-api`): an applied type filter wins; otherwise
 * the default allowlist (resources are always `reading`).
 */
export function lectureTypeCondition(
  input: Pick<LearnListingConditionsInput, 'learningType' | 'filters'>,
): SQL {
  if (input.learningType === 'resource') {
    return eq(lectures.type, LECTURE_RESOURCE_TYPE)
  }
  const types = input.filters?.types
  if (types?.length) {
    return inArray(lectures.type, types)
  }
  return inArray(lectures.type, [...DEFAULT_LECTURE_TYPES])
}

/**
 * Legacy lecture content gate (`experience-api`): a lecture stays visible only if it has
 * notes, has uploaded videos, is blended-learning, recently concluded, or is an adaptive
 * Zoom session. Not applied to resources (legacy `resources()` has no such gate).
 */
export function buildLectureContentGate(nowMs: number): SQL {
  const recentConcludeFloor = toMysqlUtc(nowMs - LECTURE_RECENT_CONCLUDE_MS)
  // Legacy gate is NULL-inclusive: Prisma `not: ''` and `not: { equals: [] }` both
  // match rows where the column is NULL, so mirror that or the counts undershoot.
  return or(
    or(isNull(lectures.notes), ne(lectures.notes, '')),
    or(isNull(lectures.videos), sql`JSON_LENGTH(${lectures.videos}) <> 0`),
    eq(lectures.type, 'blended-learning'),
    gte(lectures.concludes, recentConcludeFloor),
    like(lectures.zoomLink, '%adaptive-lecture%'),
  ) as SQL
}

/** EXISTS an attendance row of the given status for this user/lecture. */
function attendanceStatusExists(userId: number, statusValue: number): SQL {
  return exists(
    db
      .select({ exists: studentAttendances.id })
      .from(studentAttendances)
      .where(
        and(
          eq(studentAttendances.lectureId, lectures.id),
          eq(studentAttendances.userId, userId),
          eq(studentAttendances.status, statusValue),
        ),
      ),
  )
}

/**
 * Attendance filter → SQL (legacy #5: forces mandatory).
 *
 * `present` requires a `status = 1` attendance row.
 *
 * `absent` must match what the card badge actually shows as absent:
 *   1. a `status = 0` attendance row (a visible "Absent" / "Absent and Att.
 *      Window Over" chip), OR
 *   2. NO attendance row at all, but the catch-up window has closed so the card
 *      derives an `att_window_over` chip (see `buildAbsentWindowOverCondition`,
 *      which mirrors `computeCatchUpWindow`).
 *
 * A no-row lecture that is still inside its catch-up window, or whose section
 * does not count recording watch-time, shows no absent chip — so it is
 * deliberately NOT matched here.
 */
function attendanceConditions(
  attendanceStatus: BatchLearningFiltersInput['attendanceStatus'],
  userId: number,
  nowMs: number,
): Array<SQL | undefined> {
  if (attendanceStatus == null) return []

  if (attendanceStatus === 'present') {
    return [eq(lectures.optional, 0), attendanceStatusExists(userId, 1)]
  }

  const hasNoAttendanceRow = notExists(
    db
      .select({ exists: studentAttendances.id })
      .from(studentAttendances)
      .where(
        and(
          eq(studentAttendances.lectureId, lectures.id),
          eq(studentAttendances.userId, userId),
        ),
      ),
  )
  return [
    eq(lectures.optional, 0),
    or(
      attendanceStatusExists(userId, 0),
      and(hasNoAttendanceRow, buildAbsentWindowOverCondition(nowMs)),
    ),
  ]
}

/** WHERE conditions for the lectures/resources listing (everything is SQL-expressible). */
export function buildLectureListingConditions(
  input: LearnListingConditionsInput,
): Array<SQL> {
  const { filters } = input
  // Legacy LMS scopes lectures by section_id only (no batch_id on the lectures table).
  const conditions: Array<SQL | undefined> = [
    inArray(lectures.sectionId, input.sectionIds),
    lectureTypeCondition(input),
    isNull(lectures.deletedAt),
    input.learningType === 'resource'
      ? undefined
      : buildLectureContentGate(input.nowMs),
    input.search ? like(lectures.title, `%${input.search}%`) : undefined,
    ...scheduleConditions(lectures.schedule, input.window),
    bannedScheduleCondition(lectures.schedule, input.bannedScheduleCutoff),
    filters?.categories?.length
      ? inArray(lectures.category, filters.categories)
      : undefined,
    filters?.instructors?.length
      ? inArray(users.name, filters.instructors)
      : undefined,
    filters?.modules?.length
      ? buildModuleFilterCondition(
          lectures.module,
          lectures.week,
          filters.modules,
        )
      : undefined,
    filters?.priorities?.length
      ? inArray(lectures.optional, priorityToOptional(filters.priorities))
      : undefined,
    ...attendanceConditions(
      filters?.attendanceStatus,
      input.userId,
      input.nowMs,
    ),
  ]

  return conditions.filter(
    (condition): condition is SQL => condition !== undefined,
  )
}

/** WHERE conditions for the assignments listing (progress status is computed in app code). */
export function buildAssignmentListingConditions(
  input: LearnListingConditionsInput,
): Array<SQL> {
  const { filters } = input
  // Legacy LMS scopes assignments by section_id only (no batch_id on the table).
  const conditions: Array<SQL | undefined> = [
    inArray(assignments.sectionId, input.sectionIds),
    isNull(assignments.deletedAt),
    input.search ? like(assignments.title, `%${input.search}%`) : undefined,
    ...scheduleConditions(assignments.schedule, input.window),
    bannedScheduleCondition(assignments.schedule, input.bannedScheduleCutoff),
    filters?.categories?.length
      ? inArray(assignments.category, filters.categories)
      : undefined,
    filters?.types?.length
      ? inArray(assignments.type, filters.types)
      : undefined,
    filters?.instructors?.length
      ? inArray(users.name, filters.instructors)
      : undefined,
    filters?.modules?.length
      ? buildModuleFilterCondition(
          assignments.module,
          assignments.week,
          filters.modules,
        )
      : undefined,
    filters?.priorities?.length
      ? inArray(assignments.optional, priorityToOptional(filters.priorities))
      : undefined,
  ]

  return conditions.filter(
    (condition): condition is SQL => condition !== undefined,
  )
}
