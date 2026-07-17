import { and, eq, isNull, ne, sql } from 'drizzle-orm'

import { db } from '@/db'
import { threads } from '@/db/schema'
import { assertViewerOwnsDiscussion } from '@/server/new-discussions/services/assertViewerOwnsDiscussion'

/**
 * Mark every reply on the viewer's own discussion as read (replies written by
 * other users that are still unread). No-op for replies the viewer wrote.
 */
export async function markLearnDiscussionRepliesRead(options: {
  viewerUserId: number
  discussionId: number
}): Promise<void> {
  await assertViewerOwnsDiscussion(options.viewerUserId, options.discussionId)

  await db
    .update(threads)
    .set({ readAt: sql`CURRENT_TIMESTAMP` })
    .where(
      and(
        eq(threads.discussionId, options.discussionId),
        isNull(threads.deletedAt),
        isNull(threads.readAt),
        ne(threads.userId, options.viewerUserId),
      ),
    )
}
