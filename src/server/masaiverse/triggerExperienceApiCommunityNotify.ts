/**
 * Server-to-server: asks experience-api to enqueue a BullMQ job and send the community push
 * (same DB; Expo + tokens live on experience-api).
 *
 * Env (student-lms-experience):
 * - EXPERIENCE_API_BASE_URL — e.g. https://api.example.com or http://localhost:4000 (no trailing slash)
 * - COMMUNITY_MASAIVERSE_INTERNAL_SECRET — must match experience-api COMMUNITY_MASAIVERSE_INTERNAL_SECRET
 */
const HEADER = 'x-community-masaiverse-secret'

function baseUrl(): string | null {
  const raw = process.env.EXPERIENCE_API_BASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '')
}

function secret(): string | null {
  const s = process.env.COMMUNITY_MASAIVERSE_INTERNAL_SECRET?.trim()
  return s || null
}

export async function notifyCommunityPostUpvoteViaExperienceApi(payload: {
  postId: string | number
  recipientUserId: number
  actorUserId: number
  actorName?: string
}): Promise<void> {
  const base = baseUrl()
  const sec = secret()
  if (!base || !sec) {
    console.warn(
      '[communityMasaiverse] Skip upvote notify: set EXPERIENCE_API_BASE_URL and COMMUNITY_MASAIVERSE_INTERNAL_SECRET',
    )
    return
  }
  try {
    const res = await fetch(`${base}/internal/community-masaiverse/notify/post-upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HEADER]: sec,
      },
      body: JSON.stringify({
        post_id: payload.postId,
        recipient_user_id: payload.recipientUserId,
        actor_user_id: payload.actorUserId,
        actor_name: payload.actorName,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[communityMasaiverse] upvote notify HTTP', res.status, text.slice(0, 200))
    }
  } catch (e) {
    console.warn('[communityMasaiverse] upvote notify failed', e)
  }
}

export async function notifyCommunityPostReplyViaExperienceApi(payload: {
  postId: string | number
  recipientUserId: number
  actorUserId: number
  actorName?: string
  replyPreview: string
}): Promise<void> {
  const base = baseUrl()
  const sec = secret()
  if (!base || !sec) {
    console.warn(
      '[communityMasaiverse] Skip reply notify: set EXPERIENCE_API_BASE_URL and COMMUNITY_MASAIVERSE_INTERNAL_SECRET',
    )
    return
  }
  try {
    const res = await fetch(`${base}/internal/community-masaiverse/notify/post-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HEADER]: sec,
      },
      body: JSON.stringify({
        post_id: payload.postId,
        recipient_user_id: payload.recipientUserId,
        actor_user_id: payload.actorUserId,
        actor_name: payload.actorName,
        reply_preview: payload.replyPreview,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[communityMasaiverse] reply notify HTTP', res.status, text.slice(0, 200))
    }
  } catch (e) {
    console.warn('[communityMasaiverse] reply notify failed', e)
  }
}
