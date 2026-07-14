import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, discussions, lectures } from '@/db/schema'
import {
  DISCUSSION_ENTITY_ASSIGNMENT,
  DISCUSSION_ENTITY_LECTURE,
} from '@/server/new-discussions/discussionEntityTypes'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export async function assertStudentMayInteractWithDiscussion(
  viewerUserId: number,
  discussionId: number,
): Promise<void> {
  const rows = await db
    .select({
      id: discussions.id,
      entityType: discussions.entityType,
      entityId: discussions.entityId,
      userId: discussions.userId,
      public: discussions.public,
      deletedAt: discussions.deletedAt,
    })
    .from(discussions)
    .where(and(eq(discussions.id, discussionId), isNull(discussions.deletedAt)))
    .limit(1)

  const d = rows.at(0)
  if (d === undefined) {
    throw new Error('DISCUSSION_NOT_FOUND')
  }

  const maySee = Number(d.public) === 1 || d.userId === viewerUserId
  if (!maySee) {
    throw new Error('DISCUSSION_FORBIDDEN')
  }

  if (d.entityType === DISCUSSION_ENTITY_ASSIGNMENT) {
    const a = await db
      .select({
        batchId: assignments.batchId,
        sectionId: assignments.sectionId,
      })
      .from(assignments)
      .where(and(eq(assignments.id, d.entityId), isNull(assignments.deletedAt)))
      .limit(1)
    const row = a.at(0)
    if (row === undefined) throw new Error('LEARN_DETAIL_NOT_FOUND')
    const ok = await ensureUserCanAccessLearnHubEntity(
      viewerUserId,
      row.sectionId,
    )
    if (!ok) throw new Error('DISCUSSION_FORBIDDEN')
    return
  }

  if (d.entityType === DISCUSSION_ENTITY_LECTURE) {
    const r = await db
      .select({
        batchId: lectures.batchId,
        sectionId: lectures.sectionId,
      })
      .from(lectures)
      .where(and(eq(lectures.id, d.entityId), isNull(lectures.deletedAt)))
      .limit(1)
    const row = r.at(0)
    if (row === undefined) {
      throw new Error('LEARN_DETAIL_NOT_FOUND')
    }
    const ok = await ensureUserCanAccessLearnHubEntity(
      viewerUserId,
      row.sectionId,
    )
    if (!ok) throw new Error('DISCUSSION_FORBIDDEN')
    return
  }

  throw new Error('DISCUSSION_FORBIDDEN')
}
