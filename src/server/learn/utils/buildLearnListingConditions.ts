import {
  and,
  eq,
  exists,
  gte,
  inArray,
  isNull,
  like,
  lt,
  ne,
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

export interface LearnListingConditionsInput {
  learningType: LearningType
  batchId: number
  sectionIds: Array<number>
  userId: number
  filters?: BatchLearningFiltersInput
  window: LearnScheduleWindow
  search?: string
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
    input.learningType === 'resource'
      ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
      : ne(lectures.type, LECTURE_RESOURCE_TYPE),
    isNull(lectures.deletedAt),
    input.search ? like(lectures.title, `%${input.search}%`) : undefined,
    ...scheduleConditions(lectures.schedule, input.window),
    filters?.categories?.length
      ? inArray(lectures.category, filters.categories)
      : undefined,
    filters?.types?.length ? inArray(lectures.type, filters.types) : undefined,
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
