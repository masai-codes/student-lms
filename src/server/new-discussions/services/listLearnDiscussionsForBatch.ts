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

/**
 * Every public discussion in the batch, plus the viewer's own non-public
 * ones, across all lectures/resources (both live in the `lectures` table)
 * and assignments — the batch-wide feed for `/learn/discussions`.
 */
export async function listLearnDiscussionsForBatch(
  viewerUserId: number,
  batchId: number,
): Promise<Array<LearnDiscussionListItem>> {
  const [lectureRows, assignmentRows] = await Promise.all([
    db
      .select({ id: lectures.id, title: lectures.title, type: lectures.type })
      .from(lectures)
      .where(and(eq(lectures.batchId, batchId), isNull(lectures.deletedAt))),
    db
      .select({ id: assignments.id, title: assignments.title })
      .from(assignments)
      .where(
        and(eq(assignments.batchId, batchId), isNull(assignments.deletedAt)),
      ),
  ])

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
  const threadCountRows = await db
    .select({ discussionId: threads.discussionId, id: threads.id })
    .from(threads)
    .where(and(inArray(threads.discussionId, ids), isNull(threads.deletedAt)))

  const threadCountById = new Map<number, number>()
  for (const row of threadCountRows) {
    threadCountById.set(
      row.discussionId,
      (threadCountById.get(row.discussionId) ?? 0) + 1,
    )
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
        ...toDiscussionListItem(row, threadCountById.get(row.id) ?? 0),
        contentType,
        contentId: row.entityId,
        contentTitle: source.title,
      },
    ]
  })
}
