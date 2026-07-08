import { and, count, desc, eq } from 'drizzle-orm'

import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { buildLectureListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

export interface LectureListingPage {
  rows: Array<LearningEntityRow>
  pagination: LearningPagination
}

export interface FetchLectureListingPageInput extends LearnListingConditionsInput {
  page: number
  pageSize: number
}

function emptyPage(page: number, pageSize: number): LectureListingPage {
  return { rows: [], pagination: resolveListingPagination(0, page, pageSize) }
}

/**
 * Lectures/resources listing page — all filtering, ordering and pagination happen in SQL.
 * Returns the requested page of rows plus the clamped pagination envelope.
 */
export async function fetchLectureListingPage(
  input: FetchLectureListingPageInput,
): Promise<LectureListingPage> {
  if (input.sectionIds.length === 0) {
    return emptyPage(input.page, input.pageSize)
  }

  const where = and(...buildLectureListingConditions(input))

  const [countRow] = await db
    .select({ value: count() })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(where)

  const totalItems = countRow.value
  const pagination = resolveListingPagination(
    totalItems,
    input.page,
    input.pageSize,
  )
  if (totalItems === 0) {
    return { rows: [], pagination }
  }

  const offset = (pagination.page - 1) * input.pageSize
  const rows = await db
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
      isNewZoomRedirection: lectures.isNewZoomRedirection,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(where)
    .orderBy(desc(lectures.schedule))
    .limit(input.pageSize)
    .offset(offset)

  return { rows, pagination }
}
