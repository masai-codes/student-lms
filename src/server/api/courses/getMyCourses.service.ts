import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'
import {
  asRecord,
  computeCourseProgress,
  readCourseTimeline,
  resolveCourseLogo,
  resolveCourseTitle,
  resolveInstituteName,
} from '@/server/api/course/courseMeta'

/** A program the student is currently enrolled in. */
export interface MyCourseListItem {
  batchId: number
  courseTitle: string
  instituteName: string
  courseLogo: string | null
  /** Share of the program calendar elapsed, 0–100. Only meaningful when `showBatchDetails`. */
  courseProgress: number
  /**
   * `batches.settings.showBatchDetails`. Gates the progress bar and the
   * "Program Details" link — a batch without it has no detail page to link to.
   */
  showBatchDetails: boolean
}

/**
 * A program whose enrolment is paused. Unlike a cancelled one this is still
 * open — content scheduled before the pause date remains available — so the card
 * keeps its "Program Details" link.
 */
export interface PausedCourseListItem {
  batchId: number
  courseTitle: string
  instituteName: string
  courseLogo: string | null
  /** Raw IST wall-clock date or UTC instant from `batch_user.meta`; formatted client-side. */
  pausedOn: string | null
  /** As {@link MyCourseListItem.showBatchDetails} — gates the "Program Details" link. */
  showBatchDetails: boolean
}

/** A program whose enrolment has been cancelled — shown, greyed out, for the record. */
export interface CancelledCourseListItem {
  batchId: number
  courseTitle: string
  instituteName: string
  courseLogo: string | null
  /** Raw IST wall-clock date or UTC instant from `batch_user.meta`; formatted client-side. */
  cancelledOn: string | null
}

export interface MyCoursesData {
  active: Array<MyCourseListItem>
  paused: Array<PausedCourseListItem>
  cancelled: Array<CancelledCourseListItem>
}

interface BatchRow {
  id: number
  name: string
  meta: unknown
  settings: unknown
}

async function loadBatches(batchIds: Array<number>): Promise<Map<number, BatchRow>> {
  if (batchIds.length === 0) return new Map()

  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      meta: batches.meta,
      settings: batches.settings,
    })
    .from(batches)
    .where(and(inArray(batches.id, batchIds), isNull(batches.deletedAt)))

  return new Map(rows.map((row) => [row.id, row]))
}

function toActiveItem(row: BatchRow): MyCourseListItem {
  const meta = asRecord(row.meta)
  const settings = asRecord(row.settings)

  return {
    batchId: row.id,
    courseTitle: resolveCourseTitle(meta, row.name),
    instituteName: resolveInstituteName(meta),
    courseLogo: resolveCourseLogo(meta),
    courseProgress: computeCourseProgress(readCourseTimeline(meta)),
    showBatchDetails: settings.showBatchDetails === true,
  }
}

function toPausedItem(row: BatchRow, pausedOn: string | null): PausedCourseListItem {
  const meta = asRecord(row.meta)
  const settings = asRecord(row.settings)

  return {
    batchId: row.id,
    courseTitle: resolveCourseTitle(meta, row.name),
    instituteName: resolveInstituteName(meta),
    courseLogo: resolveCourseLogo(meta),
    pausedOn,
    showBatchDetails: settings.showBatchDetails === true,
  }
}

function toCancelledItem(
  row: BatchRow,
  cancelledOn: string | null,
): CancelledCourseListItem {
  const meta = asRecord(row.meta)

  return {
    batchId: row.id,
    courseTitle: resolveCourseTitle(meta, row.name),
    instituteName: resolveInstituteName(meta),
    courseLogo: resolveCourseLogo(meta),
    cancelledOn,
  }
}

/**
 * Programs the student can actually open first, the ones with no detail page last —
 * a card with no "Program Details" button is a dead end, so it should not sit above
 * a program the student can act on. Stable, so newest-enrolment-first order holds
 * within each group.
 */
function detailsFirst<T extends { showBatchDetails: boolean }>(items: Array<T>): Array<T> {
  return [
    ...items.filter((item) => item.showBatchDetails),
    ...items.filter((item) => !item.showBatchDetails),
  ]
}

/**
 * Batch IDs the user has (or had) `section_user` rows for. Cancelling an enrolment
 * writes to `batch_user.meta` but does NOT delete the `section_user` rows, so this
 * is how we confirm a cancelled `batch_user` row belongs to a batch the student was
 * genuinely in — without it, a stray admin-authored restriction row would surface a
 * program the student never joined.
 */
async function getEverEnrolledBatchIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({ batchId: sections.batchId })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(and(eq(sectionUser.userId, userId), isNull(sections.deletedAt)))

  return new Set(rows.map((row) => row.batchId))
}

/**
 * The `/my-courses` ("My Programs") listing.
 *
 * `getBatchIdsForEnrolledUser` already scopes to the request's portal and drops
 * cancelled enrolments, so `active` and `cancelled` are disjoint by construction —
 * a batch that appears in both `section_user` and a cancelled `batch_user` row is
 * shown once, under Cancelled Enrolments.
 *
 * A paused batch IS still enrolled, so it comes back from
 * `getBatchIdsForEnrolledUser`; it is moved out of `active` here so the three
 * lists stay disjoint and each program appears exactly once.
 */
export async function getMyCourses(userId: number): Promise<MyCoursesData> {
  const [activeBatchIds, restrictions, everEnrolledBatchIds] = await Promise.all([
    getBatchIdsForEnrolledUser(userId),
    getUserBatchRestrictions(userId),
    getEverEnrolledBatchIds(userId),
  ])

  const cancelledEntries = [...restrictions]
    .filter(([batchId, flags]) => flags.enrolmentCancelled && everEnrolledBatchIds.has(batchId))
    .map(([batchId, flags]) => ({
      batchId,
      cancelledOn: flags.enrolmentCancelledDate,
    }))

  const byId = await loadBatches([
    ...activeBatchIds,
    ...cancelledEntries.map((entry) => entry.batchId),
  ])

  // `getBatchIdsForEnrolledUser` already returns newest-enrolment-first, which is
  // the order this listing wants — keep it, matching /learn's default selection.
  const enrolledRows = activeBatchIds
    .map((batchId) => byId.get(batchId))
    .filter((row): row is BatchRow => row !== undefined)

  const isPaused = (batchId: number) => restrictions.get(batchId)?.paused === true

  const active = detailsFirst(
    enrolledRows.filter((row) => !isPaused(row.id)).map(toActiveItem),
  )

  const paused = detailsFirst(
    enrolledRows
      .filter((row) => isPaused(row.id))
      .map((row) => toPausedItem(row, restrictions.get(row.id)?.pausedDate ?? null)),
  )

  const cancelled = cancelledEntries
    .map((entry) => {
      const row = byId.get(entry.batchId)
      return row ? toCancelledItem(row, entry.cancelledOn) : undefined
    })
    .filter((item): item is CancelledCourseListItem => item !== undefined)

  return { active, paused, cancelled }
}
