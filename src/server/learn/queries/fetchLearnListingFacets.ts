import { and, eq, gte, inArray, isNull, lt } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AnyMySqlColumn } from 'drizzle-orm/mysql-core'

import type { LearningFilterValues, LearningType } from '@/server/learn/types'
import type { LearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'
import { db } from '@/db'
import { assignments, lectures, users } from '@/db/schema'
import { buildModuleFilterValuesFromModuleWeekRows } from '@/server/learn/utils/buildLearningFilterValues'
import { buildLearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'
import {
  buildLectureContentGate,
  lectureTypeCondition,
} from '@/server/learn/utils/buildLearnListingConditions'
import { toLearningPriority } from '@/server/learn/utils/learningDataMappers'

const UNKNOWN_INSTRUCTOR = 'Unknown Instructor'

/** Same bounds the unfiltered listing applies, so facets never surface hidden content. */
function scheduleWindowConditions(
  scheduleColumn: AnyMySqlColumn,
  window: LearnScheduleWindow,
): Array<SQL> {
  const out: Array<SQL> = []
  if (window.gte != null) out.push(gte(scheduleColumn, window.gte))
  if (window.lt != null) out.push(lt(scheduleColumn, window.lt))
  return out
}

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

/**
 * Distinct facet rows over the batch + sections + tab, constrained to the same
 * base visibility window the unfiltered listing uses (no search/active filters),
 * so every facet value maps to a lecture/assignment actually shown on that tab.
 */
async function fetchFacetRows(
  learningType: LearningType,
  sectionIds: Array<number>,
  window: LearnScheduleWindow,
  nowMs: number,
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
          // Legacy LMS scopes by section_id only (no batch_id on the table).
          inArray(assignments.sectionId, sectionIds),
          isNull(assignments.deletedAt),
          ...scheduleWindowConditions(assignments.schedule, window),
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
        inArray(lectures.sectionId, sectionIds),
        lectureTypeCondition({ learningType }),
        isNull(lectures.deletedAt),
        learningType === 'resource'
          ? undefined
          : buildLectureContentGate(nowMs),
        ...scheduleWindowConditions(lectures.schedule, window),
      ),
    )
}

/** Stable filter facets (legacy LMS surfaces all options, not just the filtered subset). */
export async function fetchLearnListingFacets(
  learningType: LearningType,
  sectionIds: Array<number>,
  nowMs: number,
  scheduleHorizonDays?: number,
): Promise<LearningFilterValues> {
  if (sectionIds.length === 0) {
    return emptyFilterValues()
  }

  // The base (no schedulePhase / no date) window — the default landing view for the
  // tab, honouring the chosen future horizon so facets match the visible listing.
  const window = buildLearnScheduleWindow({
    learningType,
    scheduleHorizonDays,
    nowMs,
  })
  const rows = await fetchFacetRows(learningType, sectionIds, window, nowMs)

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
