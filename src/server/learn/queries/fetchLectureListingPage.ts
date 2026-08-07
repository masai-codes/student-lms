import { and, count, desc, eq, sql } from 'drizzle-orm'

import type { SQL } from 'drizzle-orm'
import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import { db } from '@/db'
import { lectures, sections, users } from '@/db/schema'
import { buildLectureListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'
import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

const MIN_MS = 60 * 1000

/**
 * Reverse-chronological ordering (latest first) with one exception: live/scrum
 * sessions that are joinable RIGHT NOW are pinned to the very top so students
 * never have to scroll to join. Everything else — including upcoming and past —
 * then sorts by `schedule` descending (later date/time first; a 23:00 lecture
 * above a 22:00 one on the same day). `id` descending is the final tie-breaker.
 *
 * The "joinable now" window mirrors the legacy `LectureButtonVisibility.ts`
 * active window: 5m before start → 30m after end. Thresholds are IST wall-clock
 * strings so they compare directly against the IST-stored schedule columns.
 */
function buildLectureListingOrderBy(nowMs: number): Array<SQL> {
  const istNow = nowMs + IST_OFFSET_MS
  const wallPlus5 = toMysqlUtc(istNow + 5 * MIN_MS)
  const wallMinus30 = toMysqlUtc(istNow - 30 * MIN_MS)

  const liveNowFirst = sql`CASE
    WHEN ${lectures.type} IN ('live', 'scrum')
      AND ${lectures.schedule} <= ${wallPlus5}
      AND ${lectures.concludes} > ${wallMinus30} THEN 0
    ELSE 1
  END`

  return [sql`${liveNowFirst} ASC`, desc(lectures.schedule), desc(lectures.id)]
}

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
      zoomDetails: lectures.zoomDetails,
      sectionSettings: sections.settings,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .leftJoin(sections, eq(lectures.sectionId, sections.id))
    .where(where)
    .orderBy(...buildLectureListingOrderBy(input.nowMs))
    .limit(input.pageSize)
    .offset(offset)

  return { rows, pagination }
}
