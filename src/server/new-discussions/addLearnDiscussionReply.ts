import { createServerFn } from '@tanstack/react-start'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { addReplyToLearnDiscussion } from '@/server/new-discussions/services/addReplyToLearnDiscussion'

export const addLearnDiscussionReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { discussionId: number; message: string }) => data)
  .handler(addLearnDiscussionReplyHandler)

export async function addLearnDiscussionReplyHandler({
  data,
}: {
  data: { discussionId: number; message: string }
}) {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  if (!Number.isFinite(data.discussionId) || data.discussionId <= 0) {
    throw new Error('INVALID_DISCUSSION_ID')
  }

  await addReplyToLearnDiscussion({
    authorUserId: userId,
    discussionId: data.discussionId,
    rawMessage: data.message,
  })

  return { ok: true as const }
}
