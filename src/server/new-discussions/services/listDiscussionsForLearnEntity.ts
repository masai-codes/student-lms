import { and, count, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm'

import type { DiscussionPersistedEntityType } from '@/server/new-discussions/discussionEntityTypes'
import type { DiscussionListItem } from '@/server/learn/types'
import type { DiscussionRowWithAuthor } from '@/server/new-discussions/utils/discussionPresentation'
import { discussions, threads, users } from '@/db/schema'
import { db } from '@/db'
import { toDiscussionListItem } from '@/server/new-discussions/utils/discussionPresentation'

export async function listDiscussionsForLearnEntity(
  viewerUserId: number,
  entityType: DiscussionPersistedEntityType,
  entityId: number
): Promise<Array<DiscussionListItem>> {
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
    })
    .from(discussions)
    .leftJoin(users, eq(discussions.userId, users.id))
    .where(
      and(
        eq(discussions.entityType, entityType),
        eq(discussions.entityId, entityId),
        isNull(discussions.deletedAt),
        or(eq(discussions.public, 1), eq(discussions.userId, viewerUserId))
      )
    )
    .orderBy(desc(discussions.updatedAt))

  if (rows.length === 0) {
    return []
  }

  const ids = rows.map(r => r.id)
  const ownedIds = rows.filter(r => r.authorId === viewerUserId).map(r => r.id)

  const [countRows, unreadRows] = await Promise.all([
    db
      .select({
        discussionId: threads.discussionId,
        threadCount: count(threads.id),
      })
      .from(threads)
      .where(inArray(threads.discussionId, ids))
      .groupBy(threads.discussionId),
    ownedIds.length === 0
      ? Promise.resolve([] as Array<{ discussionId: number; unread: number }>)
      : db
          .select({
            discussionId: threads.discussionId,
            unread: count(threads.id),
          })
          .from(threads)
          .where(
            and(
              inArray(threads.discussionId, ownedIds),
              isNull(threads.deletedAt),
              isNull(threads.readAt),
              ne(threads.userId, viewerUserId),
            ),
          )
          .groupBy(threads.discussionId),
  ])

  const countById = new Map<number, number>()
  for (const c of countRows) {
    countById.set(c.discussionId, Number(c.threadCount))
  }

  const unreadById = new Map<number, number>()
  for (const u of unreadRows) {
    unreadById.set(u.discussionId, Number(u.unread))
  }

  return rows.map(r =>
    toDiscussionListItem(
      r as DiscussionRowWithAuthor,
      countById.get(r.id) ?? 0,
      [],
      unreadById.get(r.id) ?? 0,
    )
  )
}
