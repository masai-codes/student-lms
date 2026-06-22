import { and, eq, inArray, isNull, ne } from 'drizzle-orm'

import type { LearningFilterValues, LearningType } from '@/server/learn/types'
import { db } from '@/db'
import { assignments, lectures, users } from '@/db/schema'
import { buildModuleFilterValuesFromModuleWeekRows } from '@/server/learn/utils/buildLearningFilterValues'
import { toLearningPriority } from '@/server/learn/utils/learningDataMappers'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

const UNKNOWN_INSTRUCTOR = 'Unknown Instructor'

interface FacetRow {
  category: string
  type: string
  optional: number | null
  module: string | null
  week: number
  hostName: string | null
}

function emptyFilterValues(): LearningFilterValues {
  return {
    moduleFilterValues: [],
    categoryFilterValues: [],
    typeFilterValues: [],
    priorityFilterValues: [],
    instructorFilterValues: [],
  }
}

/** Distinct facet rows scoped to the batch + sections + tab — independent of active filters. */
async function fetchFacetRows(
  learningType: LearningType,
  batchId: number,
  sectionIds: Array<number>,
): Promise<Array<FacetRow>> {
  if (learningType === 'assignment') {
    return db
      .selectDistinct({
        category: assignments.category,
        type: assignments.type,
        optional: assignments.optional,
        module: assignments.module,
        week: assignments.week,
        hostName: users.name,
      })
      .from(assignments)
      .leftJoin(users, eq(assignments.userId, users.id))
      .where(
        and(
          eq(assignments.batchId, batchId),
          inArray(assignments.sectionId, sectionIds),
          isNull(assignments.deletedAt),
        ),
      )
  }

  return db
    .selectDistinct({
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      module: lectures.module,
      week: lectures.week,
      hostName: users.name,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(
      and(
        eq(lectures.batchId, batchId),
        inArray(lectures.sectionId, sectionIds),
        learningType === 'resource'
          ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
          : ne(lectures.type, LECTURE_RESOURCE_TYPE),
        isNull(lectures.deletedAt),
      ),
    )
}

/** Stable filter facets (legacy LMS surfaces all options, not just the filtered subset). */
export async function fetchLearnListingFacets(
  learningType: LearningType,
  batchId: number,
  sectionIds: Array<number>,
): Promise<LearningFilterValues> {
  if (sectionIds.length === 0) {
    return emptyFilterValues()
  }

  const rows = await fetchFacetRows(learningType, batchId, sectionIds)

  return {
    moduleFilterValues: buildModuleFilterValuesFromModuleWeekRows(rows),
    categoryFilterValues: Array.from(
      new Set(rows.map((row) => row.category)),
    ).sort(),
    typeFilterValues: Array.from(new Set(rows.map((row) => row.type))).sort(),
    priorityFilterValues: Array.from(
      new Set(rows.map((row) => toLearningPriority(row.optional))),
    ).sort(),
    instructorFilterValues: Array.from(
      new Set(rows.map((row) => row.hostName ?? UNKNOWN_INSTRUCTOR)),
    ).sort(),
  }
}
