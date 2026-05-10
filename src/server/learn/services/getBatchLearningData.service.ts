import { and, desc, eq, isNull, like, ne } from 'drizzle-orm'

import type {
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
  LearningItem,
} from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'

import { db } from '@/db'
import { assignments, lectures, users } from '@/db/schema'
import {
  buildLearningFilterValues,
  buildModuleFilterValuesFromModuleWeekRows,
} from '@/server/learn/utils/buildLearningFilterValues'
import { mapLearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isFinite(page) && page != null && page > 0 ? page : DEFAULT_PAGE
  const resolvedPageSize =
    Number.isFinite(pageSize) && pageSize != null && pageSize > 0
      ? Math.min(pageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  return { page: safePage, pageSize: resolvedPageSize }
}

function applyInMemoryFilters(
  items: Array<LearningItem>,
  filters: GetBatchLearningDataInput['filters']
): Array<LearningItem> {
  if (filters == null) {
    return items
  }

  return items.filter((item) => {
    const moduleMatch =
      filters.modules == null ||
      filters.modules.length === 0 ||
      filters.modules.includes(item.moduleName)

    const categoryMatch =
      filters.categories == null ||
      filters.categories.length === 0 ||
      filters.categories.includes(item.category)

    const typeMatch =
      filters.types == null || filters.types.length === 0 || filters.types.includes(item.type)

    const priorityMatch =
      filters.priorities == null ||
      filters.priorities.length === 0 ||
      filters.priorities.includes(item.isOptional)

    const instructorMatch =
      filters.instructors == null ||
      filters.instructors.length === 0 ||
      filters.instructors.includes(item.hostName)

    return moduleMatch && categoryMatch && typeMatch && priorityMatch && instructorMatch
  })
}

async function fetchLectureLikeItems(
  input: GetBatchLearningDataInput
): Promise<Array<LearningEntityRow>> {
  const lectureTypeCondition =
    input.learningType === 'resource'
      ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
      : ne(lectures.type, LECTURE_RESOURCE_TYPE)

  const conditions = [
    eq(lectures.batchId, input.batchId),
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
      week: lectures.week,
      module: lectures.module,
      hostName: users.name,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(and(...conditions))
    .orderBy(desc(lectures.schedule), desc(lectures.createdAt))
}

/** All module/week pairs for this batch tab — no title search (facets stay complete). */
async function fetchModuleWeekFacetRows(
  input: GetBatchLearningDataInput,
): Promise<Array<{ module: string | null; week: number }>> {
  if (input.learningType === 'assignment') {
    return db
      .select({ module: assignments.module, week: assignments.week })
      .from(assignments)
      .where(and(eq(assignments.batchId, input.batchId), isNull(assignments.deletedAt)))
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
        lectureTypeCondition,
        isNull(lectures.deletedAt),
      ),
    )
}

async function fetchAssignmentItems(
  input: GetBatchLearningDataInput
): Promise<Array<LearningEntityRow>> {
  const conditions = [
    eq(assignments.batchId, input.batchId),
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
      week: assignments.week,
      module: assignments.module,
      hostName: users.name,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(assignments.schedule), desc(assignments.createdAt))
}

export async function getBatchLearningData(
  input: GetBatchLearningDataInput
): Promise<GetBatchLearningDataResponse> {
  const { page, pageSize } = normalizePagination(input.page, input.pageSize)
  const [moduleWeekFacetRows, sourceRows] = await Promise.all([
    fetchModuleWeekFacetRows(input),
    input.learningType === 'assignment'
      ? fetchAssignmentItems(input)
      : fetchLectureLikeItems(input),
  ])

  const moduleFilterValuesAll = buildModuleFilterValuesFromModuleWeekRows(moduleWeekFacetRows)

  const mappedItems = sourceRows.map((row) => mapLearningEntityRow(row, input.learningType))
  const filteredItems = applyInMemoryFilters(mappedItems, input.filters)

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
