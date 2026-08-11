import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, discussions, lectures, threads, users } from '@/db/schema'
import {
  DISCUSSION_ENTITY_ASSIGNMENT,
  DISCUSSION_ENTITY_LECTURE,
} from '@/server/new-discussions/discussionEntityTypes'
import { toDiscussionListItem } from '@/server/new-discussions/utils/discussionPresentation'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import type { LearnDiscussionListItem } from '@/server/learn/types'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getAccessibleSectionIdsForUserInBatch } from '@/server/learn/utils/ensureLearnEntityAccess'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'
import { getPausedCutoff } from '@/server/restrictions/enrollmentRestrictionScope'
import { isScheduledAfterCutoff } from '@/server/restrictions/restrictionDates'

/**
 * Every public discussion on content in the viewer's own sections of `batchId`,
 * plus the viewer's own non-public ones, across lectures/resources (both live in
 * the `lectures` table) and assignments — the feed for `/learn/discussions`.
 *
 * Two independent scopes, both required:
 *
 * 1. Enrolment — returns nothing if the viewer's enrolment in `batchId` is not
 *    active ({@link getBatchIdsForEnrolledUser}), e.g. a cancelled enrolment or a
 *    batch the viewer was never in, so a stale/direct `batchId` can't surface
 *    another batch's public discussions.
 * 2. Section — content is matched on `section_id`, never on `batch_id`, using the
 *    exact predicate the detail page gates on
 *    ({@link getAccessibleSectionIdsForUserInBatch}). Matching on `batch_id` here
 *    listed every sibling section's public discussions — hundreds of unrelated
 *    sections share the catch-all "Masai" batch — which then 404'd on click
 *    because `ensureUserCanAccessLearnHubEntity` requires section membership.
 *
 * `batch_id` is deliberately NOT also filtered on: it disagrees with the row's
 * `sections.batch_id` on a few hundred live rows, and the detail page ignores it,
 * so adding it would hide content the viewer can legitimately open. Rows with a
 * NULL `section_id` drop out for the same reason — the gate rejects them too.
 *
 * Paused batch: content scheduled after the pause cutoff is dropped, so its
 * discussions disappear from the feed — the same rule the lecture/assignment
 * listing applies via `bannedScheduleCutoff`, and what the detail page blocks on
 * ({@link resolveLearnDetailRestriction}). Without it a paused student kept
 * seeing (and could open) threads on content they are restricted from.
 */
export async function listLearnDiscussionsForBatch(
  viewerUserId: number,
  batchId: number,
): Promise<Array<LearnDiscussionListItem>> {
  const enrolledBatchIds = await getBatchIdsForEnrolledUser(viewerUserId)
  if (!enrolledBatchIds.includes(batchId)) {
    return []
  }

  const sectionIds = await getAccessibleSectionIdsForUserInBatch(
    viewerUserId,
    batchId,
  )
  if (!sectionIds.length) {
    return []
  }

  const [allLectureRows, allAssignmentRows, restrictions] = await Promise.all([
    db
      .select({
        id: lectures.id,
        title: lectures.title,
        type: lectures.type,
        schedule: lectures.schedule,
      })
      .from(lectures)
      .where(
        and(
          inArray(lectures.sectionId, sectionIds),
          isNull(lectures.deletedAt),
        ),
      ),
    db
      .select({
        id: assignments.id,
        title: assignments.title,
        schedule: assignments.schedule,
      })
      .from(assignments)
      .where(
        and(
          inArray(assignments.sectionId, sectionIds),
          isNull(assignments.deletedAt),
        ),
      ),
    getUserBatchRestrictions(viewerUserId),
  ])

  const pausedCutoff = getPausedCutoff(restrictions, batchId)
  const isVisible = (row: { schedule: string | null }) =>
    pausedCutoff == null || !isScheduledAfterCutoff(row.schedule, pausedCutoff)

  const lectureRows = allLectureRows.filter(isVisible)
  const assignmentRows = allAssignmentRows.filter(isVisible)

  if (!lectureRows.length && !assignmentRows.length) {
    return []
  }

  const lectureById = new Map(lectureRows.map((row) => [row.id, row]))
  const assignmentById = new Map(assignmentRows.map((row) => [row.id, row]))
  const lectureIds = lectureRows.map((row) => row.id)
  const assignmentIds = assignmentRows.map((row) => row.id)

  const entityFilters = []
  if (lectureIds.length) {
    entityFilters.push(
      and(
        eq(discussions.entityType, DISCUSSION_ENTITY_LECTURE),
        inArray(discussions.entityId, lectureIds),
      ),
    )
  }
  if (assignmentIds.length) {
    entityFilters.push(
      and(
        eq(discussions.entityType, DISCUSSION_ENTITY_ASSIGNMENT),
        inArray(discussions.entityId, assignmentIds),
      ),
    )
  }
  if (!entityFilters.length) {
    return []
  }

  const rows = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      message: discussions.message,
      isClosed: discussions.isClosed,
      public: discussions.public,
      data: discussions.data,
      createdAt: discussions.createdAt,
      updatedAt: discussions.updatedAt,
      authorId: discussions.userId,
      authorName: users.name,
      entityType: discussions.entityType,
      entityId: discussions.entityId,
    })
    .from(discussions)
    .leftJoin(users, eq(discussions.userId, users.id))
    .where(
      and(
        or(...entityFilters),
        isNull(discussions.deletedAt),
        or(eq(discussions.public, 1), eq(discussions.userId, viewerUserId)),
      ),
    )
    .orderBy(desc(discussions.updatedAt))

  if (!rows.length) {
    return []
  }

  const ids = rows.map((row) => row.id)
  const threadRows = await db
    .select({
      discussionId: threads.discussionId,
      id: threads.id,
      readAt: threads.readAt,
      authorId: threads.userId,
    })
    .from(threads)
    .where(and(inArray(threads.discussionId, ids), isNull(threads.deletedAt)))

  const ownerByDiscussionId = new Map<number, number>()
  for (const row of rows) {
    ownerByDiscussionId.set(row.id, row.authorId)
  }

  const threadCountById = new Map<number, number>()
  const unreadByDiscussionId = new Map<number, number>()
  for (const row of threadRows) {
    threadCountById.set(
      row.discussionId,
      (threadCountById.get(row.discussionId) ?? 0) + 1,
    )

    // Unread replies matter only to the discussion owner, and only for
    // replies written by someone else that have not been marked read.
    const isOwner = ownerByDiscussionId.get(row.discussionId) === viewerUserId
    if (isOwner && row.readAt === null && row.authorId !== viewerUserId) {
      unreadByDiscussionId.set(
        row.discussionId,
        (unreadByDiscussionId.get(row.discussionId) ?? 0) + 1,
      )
    }
  }

  return rows.flatMap((row): Array<LearnDiscussionListItem> => {
    const isAssignment = row.entityType === DISCUSSION_ENTITY_ASSIGNMENT
    const source = isAssignment
      ? assignmentById.get(row.entityId)
      : lectureById.get(row.entityId)
    if (!source) return []

    const contentType = isAssignment
      ? 'assignment'
      : 'type' in source && source.type === LECTURE_RESOURCE_TYPE
        ? 'resource'
        : 'lecture'

    return [
      {
        ...toDiscussionListItem(
          row,
          threadCountById.get(row.id) ?? 0,
          [],
          unreadByDiscussionId.get(row.id) ?? 0,
        ),
        contentType,
        contentId: row.entityId,
        contentTitle: source.title,
      },
    ]
  })
}
