import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { discussions } from '@/db/schema'

export type OwnedDiscussionRow = {
  id: number
  userId: number
  isClosed: number
  data: Record<string, unknown> | null
}

/**
 * Ensure the viewer is the author of the discussion. Only owners may close /
 * reopen or leave feedback on their own discussion. Returns the row so callers
 * avoid a second read.
 */
export async function assertViewerOwnsDiscussion(
  viewerUserId: number,
  discussionId: number,
): Promise<OwnedDiscussionRow> {
  const rows = await db
    .select({
      id: discussions.id,
      userId: discussions.userId,
      isClosed: discussions.isClosed,
      data: discussions.data,
    })
    .from(discussions)
    .where(and(eq(discussions.id, discussionId), isNull(discussions.deletedAt)))
    .limit(1)

  const row = rows.at(0)
  if (row === undefined) {
    throw new Error('DISCUSSION_NOT_FOUND')
  }
  if (row.userId !== viewerUserId) {
    throw new Error('DISCUSSION_FORBIDDEN')
  }
  return {
    id: row.id,
    userId: row.userId,
    isClosed: Number(row.isClosed),
    data: (row.data as Record<string, unknown> | null) ?? null,
  }
}
