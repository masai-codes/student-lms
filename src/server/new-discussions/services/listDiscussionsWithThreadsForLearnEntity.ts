import { and, asc, count, desc, eq, inArray, isNull, or } from 'drizzle-orm'

import type { DiscussionPersistedEntityType } from '@/server/new-discussions/discussionEntityTypes'
import type { DiscussionListItem } from '@/server/learn/types'
import type { DiscussionRowWithAuthor } from '@/server/new-discussions/utils/discussionPresentation'
import { discussions, threads, users } from '@/db/schema'
import { db } from '@/db'
import { toDiscussionListItem } from '@/server/new-discussions/utils/discussionPresentation'
import { mapDiscussionThreadRow } from '@/server/new-discussions/utils/mapDiscussionThreadRow'

export async function listDiscussionsWithThreadsForLearnEntity(
  viewerUserId: number,
  entityType: DiscussionPersistedEntityType,
  entityId: number,
): Promise<Array<DiscussionListItem>> {
  const rows = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      message: discussions.message,
      isClosed: discussions.isClosed,
      public: discussions.public,
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
        or(eq(discussions.public, 1), eq(discussions.userId, viewerUserId)),
      ),
    )
    .orderBy(desc(discussions.updatedAt))

  if (rows.length === 0) {
    return []
  }

  const ids = rows.map(r => r.id)

  const [countRows, threadRows] = await Promise.all([
    db
      .select({
        discussionId: threads.discussionId,
        threadCount: count(threads.id),
      })
      .from(threads)
      .where(inArray(threads.discussionId, ids))
      .groupBy(threads.discussionId),
    db
      .select({
        id: threads.id,
        discussionId: threads.discussionId,
        message: threads.message,
        createdAt: threads.createdAt,
        authorId: threads.userId,
        authorName: users.name,
        authorProfilePhotoPath: users.profilePhotoPath,
      })
      .from(threads)
      .leftJoin(users, eq(threads.userId, users.id))
      .where(and(inArray(threads.discussionId, ids), isNull(threads.deletedAt)))
      .orderBy(asc(threads.createdAt)),
  ])

  const countById = new Map<number, number>()
  for (const c of countRows) {
    countById.set(c.discussionId, Number(c.threadCount))
  }

  const threadsByDiscussionId = new Map<number, DiscussionListItem['threads']>()
  for (const thread of threadRows) {
    const list = threadsByDiscussionId.get(thread.discussionId) ?? []
    list.push(mapDiscussionThreadRow(thread))
    threadsByDiscussionId.set(thread.discussionId, list)
  }

  return rows.map(r =>
    toDiscussionListItem(
      r as DiscussionRowWithAuthor,
      countById.get(r.id) ?? 0,
      threadsByDiscussionId.get(r.id) ?? [],
    ),
  )
}
