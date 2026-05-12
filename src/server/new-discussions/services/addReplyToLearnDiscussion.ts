import { eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { discussions, threads } from '@/db/schema'
import { assertStudentMayInteractWithDiscussion } from '@/server/new-discussions/services/discussionAccess'
import { parseReplyMessage } from '@/server/new-discussions/utils/validateDiscussionWriteInput'

export async function addReplyToLearnDiscussion(options: {
  authorUserId: number
  discussionId: number
  rawMessage: string
}): Promise<void> {
  const message = parseReplyMessage(options.rawMessage)
  await assertStudentMayInteractWithDiscussion(options.authorUserId, options.discussionId)

  await db.transaction(async tx => {
    await tx.insert(threads).values({
      discussionId: options.discussionId,
      userId: options.authorUserId,
      message,
      public: 0,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    await tx
      .update(discussions)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(discussions.id, options.discussionId))
  })
}
