import { eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { discussions } from '@/db/schema'
import { assertViewerOwnsDiscussion } from '@/server/new-discussions/services/assertViewerOwnsDiscussion'

/**
 * Close ("resolve") or reopen a discussion. Only the author may do this. Returns
 * the resulting closed state (idempotent when already in the requested state).
 */
export async function setLearnDiscussionClosed(options: {
  viewerUserId: number
  discussionId: number
  isClosed: boolean
}): Promise<{ isClosed: boolean }> {
  const discussion = await assertViewerOwnsDiscussion(
    options.viewerUserId,
    options.discussionId,
  )

  const nextValue = options.isClosed ? 1 : 0
  if (discussion.isClosed === nextValue) {
    return { isClosed: options.isClosed }
  }

  await db
    .update(discussions)
    .set({ isClosed: nextValue, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(discussions.id, options.discussionId))

  return { isClosed: options.isClosed }
}
