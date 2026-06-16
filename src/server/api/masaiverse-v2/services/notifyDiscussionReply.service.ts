import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { notifyDiscussionReplyViaExperienceApi } from '@/server/masaiverse/triggerExperienceApiCommunityNotify'

/** The notificationType sent for every discussion reply (public + club). */
export const DISCUSSION_REPLY_NOTIFICATION_TYPE = 'discussion-reply-received'

/**
 * Sends the post author an app notification when someone else replies to their
 * discussion. Public discussions carry only `postId`; club discussions also carry
 * `clubId`. No-ops on self-replies and missing posts. Never throws — the underlying
 * trigger swallows transport errors so reply creation is never blocked.
 */
export async function notifyDiscussionReply(input: {
  postId: number
  replierId: number
  replyPreview: string
}): Promise<void> {
  const post = (
    await db
      .select({ authorId: posts.userId, clubId: posts.clubId })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1)
  ).at(0)
  // No post, or the author replied to their own thread — nothing to notify.
  if (!post || post.authorId === input.replierId) return

  await notifyDiscussionReplyViaExperienceApi({
    postId: input.postId,
    recipientUserId: post.authorId,
    actorUserId: input.replierId,
    replyPreview: input.replyPreview,
    clubId: post.clubId ?? null,
    notificationType: DISCUSSION_REPLY_NOTIFICATION_TYPE,
  })
}
