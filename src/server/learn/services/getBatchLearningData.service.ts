import { and, desc, eq, inArray, isNull, like, ne } from 'drizzle-orm'

import { getSectionIdsForUserInBatch } from '@/server/batches/getSectionIdsForUserInBatch'

import type {
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
} from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'

import { db } from '@/db'
import { assignments, lectures, submissions, users } from '@/db/schema'
import {
  buildLearningFilterValues,
  buildModuleFilterValuesFromModuleWeekRows,
} from '@/server/learn/utils/buildLearningFilterValues'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { buildLearnListingCardCtas } from '@/server/learn/utils/buildLearnListingCardCtas'
import {
  mapLearningEntityRow,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import {
  calculateAssignmentProgressStatus,
  type AssignmentProgressStatus,
  type AssignmentSubmissionProgress,
} from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'
import type { ResourcePhase } from '@/server/learn/resourceDetailTypes'
import { applyLearnListingFilters } from '@/server/learn/utils/applyLearnListingFilters'

const DEFAULT_PAGE = 1
/** Legacy learn listings use `ROW_PER_PAGE = 15` in experience-ui. */
const DEFAULT_PAGE_SIZE = 15
const MAX_PAGE_SIZE = 50

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isFinite(page) && page != null && page > 0 ? page : DEFAULT_PAGE
  const resolvedPageSize =
    Number.isFinite(pageSize) && pageSize != null && pageSize > 0
      ? Math.min(pageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  return { page: safePage, pageSize: resolvedPageSize }
}

async function fetchLectureLikeItems(
  input: GetBatchLearningDataInput,
  sectionIds: Array<number>,
): Promise<Array<LearningEntityRow>> {
  if (sectionIds.length === 0) {
    return []
  }

  const lectureTypeCondition =
    input.learningType === 'resource'
      ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
      : ne(lectures.type, LECTURE_RESOURCE_TYPE)

  const conditions = [
    eq(lectures.batchId, input.batchId),
    inArray(lectures.sectionId, sectionIds),
    lectureTypeCondition,
    isNull(lectures.deletedAt),
    input.search != null && input.search.trim().length > 0
      ? like(lectures.title, `%${input.search.trim()}%`)
      : undefined,
  ].filter((condition) => condition !== undefined)

  return db
    .select({
      id: lectures.id,
      title: lectures.title,
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      sectionId: lectures.sectionId,
      week: lectures.week,
      module: lectures.module,
      hostName: users.name,
      zoomLink: lectures.zoomLink,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(and(...conditions))
    .orderBy(desc(lectures.schedule))
}

/** All module/week pairs for this batch tab — no title search (facets stay complete). */
async function fetchModuleWeekFacetRows(
  input: GetBatchLearningDataInput,
  sectionIds: Array<number>,
): Promise<Array<{ module: string | null; week: number }>> {
  if (sectionIds.length === 0) {
    return []
  }

  if (input.learningType === 'assignment') {
    return db
      .select({ module: assignments.module, week: assignments.week })
      .from(assignments)
      .where(
        and(
          eq(assignments.batchId, input.batchId),
          inArray(assignments.sectionId, sectionIds),
          isNull(assignments.deletedAt),
        ),
      )
  }

  const lectureTypeCondition =
    input.learningType === 'resource'
      ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
      : ne(lectures.type, LECTURE_RESOURCE_TYPE)

  return db
    .select({ module: lectures.module, week: lectures.week })
    .from(lectures)
    .where(
      and(
        eq(lectures.batchId, input.batchId),
        inArray(lectures.sectionId, sectionIds),
        lectureTypeCondition,
        isNull(lectures.deletedAt),
      ),
    )
}

async function fetchAssignmentItems(
  input: GetBatchLearningDataInput,
  sectionIds: Array<number>,
): Promise<Array<LearningEntityRow>> {
  if (sectionIds.length === 0) {
    return []
  }

  const conditions = [
    eq(assignments.batchId, input.batchId),
    inArray(assignments.sectionId, sectionIds),
    isNull(assignments.deletedAt),
    input.search != null && input.search.trim().length > 0
      ? like(assignments.title, `%${input.search.trim()}%`)
      : undefined,
  ].filter((condition) => condition !== undefined)

  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      category: assignments.category,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      concludes: assignments.concludes,
      week: assignments.week,
      module: assignments.module,
      hostName: users.name,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(assignments.id))
}

async function fetchAssignmentProgressById(
  userId: number,
  sourceRows: Array<LearningEntityRow>,
  nowMs: number,
): Promise<Map<number, AssignmentProgressStatus>> {
  const assignmentIds = sourceRows.map((row) => row.id)
  if (assignmentIds.length === 0) return new Map()

  const submissionRows = await db
    .select({
      assignmentId: submissions.assignmentId,
      completed: submissions.completed,
      status: submissions.status,
      markAsCompleted: submissions.markAsCompleted,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        isNull(submissions.deletedAt),
        inArray(submissions.assignmentId, assignmentIds),
      ),
    )
    .orderBy(desc(submissions.createdAt))

  const submissionByAssignmentId = new Map<number, AssignmentSubmissionProgress>()
  for (const row of submissionRows) {
    if (!submissionByAssignmentId.has(row.assignmentId)) {
      submissionByAssignmentId.set(row.assignmentId, {
        completed: row.completed === 1,
        status: row.status ?? null,
        markAsCompleted: row.markAsCompleted === 1,
      })
    }
  }

  const progressById = new Map<number, AssignmentProgressStatus>()
  for (const row of sourceRows) {
    const progressStatus = calculateAssignmentProgressStatus({
      schedule: row.schedule,
      concludes: row.concludes ?? null,
      nowMs,
      submission: submissionByAssignmentId.get(row.id) ?? null,
    })
    progressById.set(row.id, progressStatus)
  }

  return progressById
}

function buildResourcePhaseById(
  sourceRows: Array<LearningEntityRow>,
  nowMs: number,
): Map<number, ResourcePhase> {
  return new Map(
    sourceRows.map((row) => [
      row.id,
      resolveAssignmentPhase({
        schedule: row.schedule,
        concludes: row.concludes ?? null,
        nowMs,
      }),
    ]),
  )
}

export async function getBatchLearningData(
  input: GetBatchLearningDataInput,
  userId: number,
): Promise<GetBatchLearningDataResponse> {
  const { page, pageSize } = normalizePagination(input.page, input.pageSize)
  const nowMs = Date.now()
  const sectionIds = await getSectionIdsForUserInBatch(userId, input.batchId)

  const [moduleWeekFacetRows, sourceRows] = await Promise.all([
    fetchModuleWeekFacetRows(input, sectionIds),
    input.learningType === 'assignment'
      ? fetchAssignmentItems(input, sectionIds)
      : fetchLectureLikeItems(input, sectionIds),
  ])

  const moduleFilterValuesAll = buildModuleFilterValuesFromModuleWeekRows(moduleWeekFacetRows)

  const attendanceSummaries =
    input.learningType === 'lecture'
      ? await fetchLectureAttendanceSummaries(
          userId,
          sourceRows
            .filter((row) => row.sectionId != null)
            .map((row) => ({
              lectureId: row.id,
              sectionId: row.sectionId!,
              schedule: row.schedule,
              concludes: row.concludes ?? null,
              optional: row.optional,
            })),
        )
      : new Map()

  const assignmentProgressById =
    input.learningType === 'assignment'
      ? await fetchAssignmentProgressById(userId, sourceRows, nowMs)
      : new Map<number, AssignmentProgressStatus>()

  const resourcePhaseById =
    input.learningType === 'resource'
      ? buildResourcePhaseById(sourceRows, nowMs)
      : new Map<number, ResourcePhase>()

  const rowsById = new Map(sourceRows.map((row) => [row.id, row]))

  const mappedItems = sourceRows.map((row) => {
    const attendance = attendanceSummaries.get(row.id) ?? null
    const assignmentProgressStatus = assignmentProgressById.get(row.id) ?? null
    const listingCtas = buildLearnListingCardCtas({
      learningType: input.learningType,
      itemType: row.type,
      schedule: row.schedule,
      concludes: row.concludes ?? null,
      isMandatory: toLearningPriority(row.optional) === 'mandatory',
      zoomLink: row.zoomLink ?? null,
      nowMs,
      attendance,
      assignmentProgressStatus,
    })

    return mapLearningEntityRow(
      row,
      input.learningType,
      listingCtas,
      attendance,
      assignmentProgressStatus,
      resourcePhaseById.get(row.id) ?? null,
    )
  })
  const filteredItems = applyLearnListingFilters(
    mappedItems,
    rowsById,
    input.filters,
    nowMs,
  )

  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const offset = (safePage - 1) * pageSize
  const learningItems = filteredItems.slice(offset, offset + pageSize)

  return {
    filterValues: {
      ...buildLearningFilterValues(filteredItems),
      moduleFilterValues: moduleFilterValuesAll,
    },
    learningItems,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  }
}
