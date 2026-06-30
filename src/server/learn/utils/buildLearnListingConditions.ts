import {
  and,
  eq,
  exists,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  ne,
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
  return or(
    and(isNotNull(lectures.notes), ne(lectures.notes, '')),
    sql`JSON_LENGTH(${lectures.videos}) > 0`,
    eq(lectures.type, 'blended-learning'),
    gte(lectures.concludes, recentConcludeFloor),
    like(lectures.zoomLink, '%adaptive-lecture%'),
  ) as SQL
}

/** Mandatory lecture with an attendance row of the requested status (legacy #5: forces mandatory). */
function attendanceConditions(
  attendanceStatus: BatchLearningFiltersInput['attendanceStatus'],
  userId: number,
): Array<SQL> {
  if (attendanceStatus == null) return []
  const statusValue = attendanceStatus === 'present' ? 1 : 0
  return [
    eq(lectures.optional, 0),
    exists(
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
    ),
  ]
}

/** WHERE conditions for the lectures/resources listing (everything is SQL-expressible). */
export function buildLectureListingConditions(
  input: LearnListingConditionsInput,
): Array<SQL> {
  const { filters } = input
  const conditions: Array<SQL | undefined> = [
    eq(lectures.batchId, input.batchId),
    inArray(lectures.sectionId, input.sectionIds),
    lectureTypeCondition(input),
    isNull(lectures.deletedAt),
    input.learningType === 'resource'
      ? undefined
      : buildLectureContentGate(input.nowMs),
    input.search ? like(lectures.title, `%${input.search}%`) : undefined,
    ...scheduleConditions(lectures.schedule, input.window),
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
    ...attendanceConditions(filters?.attendanceStatus, input.userId),
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
  const conditions: Array<SQL | undefined> = [
    eq(assignments.batchId, input.batchId),
    inArray(assignments.sectionId, input.sectionIds),
    isNull(assignments.deletedAt),
    input.search ? like(assignments.title, `%${input.search}%`) : undefined,
    ...scheduleConditions(assignments.schedule, input.window),
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
