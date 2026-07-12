import { eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { discussions } from '@/db/schema'
import { assertViewerOwnsDiscussion } from '@/server/new-discussions/services/assertViewerOwnsDiscussion'
import { DISCUSSION_FEEDBACK_DATA_KEY } from '@/server/new-discussions/utils/discussionPresentation'
import { parseDiscussionFeedbackInput } from '@/server/new-discussions/utils/validateDiscussionFeedbackInput'

/**
 * Persist the owner's 1–5 rating (and optional comment) about how their
 * discussion was resolved, merged into `discussions.data` under
 * `DISCUSSION_FEEDBACK_DATA_KEY`. Only the author may leave feedback.
 */
export async function submitLearnDiscussionFeedback(options: {
  viewerUserId: number
  discussionId: number
  rating: unknown
  comment?: unknown
}): Promise<{ rating: number }> {
  const feedback = parseDiscussionFeedbackInput({
    rating: options.rating,
    comment: options.comment,
  })

  const discussion = await assertViewerOwnsDiscussion(
    options.viewerUserId,
    options.discussionId,
  )

  const nextData = {
    ...(discussion.data ?? {}),
    [DISCUSSION_FEEDBACK_DATA_KEY]: {
      rating: feedback.rating,
      comment: feedback.comment,
    },
  }

  await db
    .update(discussions)
    .set({ data: nextData, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(discussions.id, options.discussionId))

  return { rating: feedback.rating }
}
