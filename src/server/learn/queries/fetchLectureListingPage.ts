import { and, asc, count, eq, sql } from 'drizzle-orm'

import type { SQL } from 'drizzle-orm'
import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { buildLectureListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'
import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

const MIN_MS = 60 * 1000

/**
 * Ordering that matches the legacy `experience-ui` `/learn` view
 * (`SectionLectures.tsx` priority-bucketed sort). Bucketed by urgency, then
 * schedule ascends for the live/upcoming buckets and descends for past:
 *   1 = live/scrum joinable now, 2 = about to start, 3 = upcoming, 4 = past.
 *
 * The live-session windows mirror `LectureButtonVisibility.ts`:
 *   active  = 5m before start → 30m after end
 *   visible = 10m → 5m before start
 *
 * Thresholds are IST wall-clock strings (`now (+/- delta) + 5:30`) so they
 * compare directly against the IST-stored `schedule` / `concludes` columns,
 * consistent with the schedule-window filter.
 */
function buildLectureListingOrderBy(nowMs: number): Array<SQL> {
  const istNow = nowMs + IST_OFFSET_MS
  const wallNow = toMysqlUtc(istNow)
  const wallPlus5 = toMysqlUtc(istNow + 5 * MIN_MS)
  const wallPlus10 = toMysqlUtc(istNow + 10 * MIN_MS)
  const wallMinus30 = toMysqlUtc(istNow - 30 * MIN_MS)

  const bucket = sql`CASE
    WHEN ${lectures.type} IN ('live', 'scrum')
      AND ${lectures.schedule} <= ${wallPlus5}
      AND ${lectures.concludes} > ${wallMinus30} THEN 1
    WHEN ${lectures.type} IN ('live', 'scrum')
      AND ${lectures.schedule} >= ${wallPlus5}
      AND ${lectures.schedule} < ${wallPlus10}
      AND ${lectures.concludes} >= ${wallNow} THEN 2
    WHEN ${lectures.schedule} > ${wallNow} THEN 3
    ELSE 4
  END`

  return [
    sql`${bucket} ASC`,
    // Buckets 1-3 (live/upcoming) ascend by schedule so the soonest floats up;
    // bucket 4 (past) descends so the most recent past sits on top.
    sql`CASE WHEN ${bucket} <= 3 THEN ${lectures.schedule} END ASC`,
    sql`CASE WHEN ${bucket} = 4 THEN ${lectures.schedule} END DESC`,
    asc(lectures.id),
  ]
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
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .where(where)
    .orderBy(...buildLectureListingOrderBy(input.nowMs))
    .limit(input.pageSize)
    .offset(offset)

  return { rows, pagination }
}
