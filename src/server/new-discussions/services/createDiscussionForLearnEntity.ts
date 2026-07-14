import { and, desc, eq, isNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, discussions, lectures } from '@/db/schema'
import {
  DISCUSSION_ENTITY_ASSIGNMENT,
  DISCUSSION_ENTITY_LECTURE,
} from '@/server/new-discussions/discussionEntityTypes'
import { checkIfValidQuery } from '@/server/new-discussions/services/checkIfValidQuery'
import { resolveAssigneeFromSection } from '@/server/new-discussions/services/resolveAssigneeFromSection'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export type CreateLearnDiscussionKind = 'assignment' | 'lecture'

async function resolveDiscussionVisibility(
  title: string,
  message: string,
): Promise<number> {
  const isPublic = await checkIfValidQuery(`${title}\n\n${message}`)
  return isPublic ? 1 : 0
}

export async function createDiscussionForLearnEntity(options: {
  authorUserId: number
  kind: CreateLearnDiscussionKind
  entityId: number
  title: string
  message: string
}): Promise<{ discussionId: number }> {
  const { authorUserId, kind, entityId, title, message } = options

  if (kind === 'assignment') {
    const rows = await db
      .select({
        batchId: assignments.batchId,
        sectionId: assignments.sectionId,
        instructorId: assignments.userId,
      })
      .from(assignments)
      .where(and(eq(assignments.id, entityId), isNull(assignments.deletedAt)))
      .limit(1)

    const a = rows.at(0)
    if (a === undefined) throw new Error('LEARN_DETAIL_NOT_FOUND')

    const allowed = await ensureUserCanAccessLearnHubEntity(
      authorUserId,
      a.batchId,
      a.sectionId,
    )
    if (!allowed) throw new Error('LEARN_DETAIL_NOT_FOUND')

    const assigneeId = await resolveAssigneeFromSection(
      authorUserId,
      a.sectionId,
      a.instructorId,
    )

    const isPublic = await resolveDiscussionVisibility(title, message)

    await db.insert(discussions).values({
      entityType: DISCUSSION_ENTITY_ASSIGNMENT,
      entityId,
      userId: authorUserId,
      title,
      message,
      public: isPublic,
      isClosed: 0,
      assigneeId,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })

    const inserted = await db
      .select({ id: discussions.id })
      .from(discussions)
      .where(
        and(
          eq(discussions.entityId, entityId),
          eq(discussions.userId, authorUserId),
        ),
      )
      .orderBy(desc(discussions.id))
      .limit(1)

    const created = inserted.at(0)
    if (created === undefined) throw new Error('DISCUSSION_CREATE_FAILED')
    return { discussionId: created.id }
  }

  const lect = await db
    .select({
      batchId: lectures.batchId,
      sectionId: lectures.sectionId,
      hostId: lectures.hostId,
      ownerId: lectures.userId,
    })
    .from(lectures)
    .where(and(eq(lectures.id, entityId), isNull(lectures.deletedAt)))
    .limit(1)

  const L = lect.at(0)
  if (L === undefined) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    authorUserId,
    L.batchId,
    L.sectionId,
  )
  if (!allowed) throw new Error('LEARN_DETAIL_NOT_FOUND')

  const fallbackHost = L.hostId ?? L.ownerId
  const assigneeId = await resolveAssigneeFromSection(
    authorUserId,
    L.sectionId,
    fallbackHost,
  )

  const isPublic = await resolveDiscussionVisibility(title, message)

  await db.insert(discussions).values({
    entityType: DISCUSSION_ENTITY_LECTURE,
    entityId,
    userId: authorUserId,
    title,
    message,
    public: isPublic,
    isClosed: 0,
    assigneeId,
    createdAt: sql`CURRENT_TIMESTAMP`,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  })

  const inserted = await db
    .select({ id: discussions.id })
    .from(discussions)
    .where(
      and(
        eq(discussions.entityId, entityId),
        eq(discussions.userId, authorUserId),
      ),
    )
    .orderBy(desc(discussions.id))
    .limit(1)

  const created = inserted.at(0)
  if (created === undefined) throw new Error('DISCUSSION_CREATE_FAILED')
  return { discussionId: created.id }
}
