/**
 * Server-to-server: asks experience-api to enqueue a BullMQ job and send a Masaiverse
 * app push notification (same DB; Expo + device tokens live on experience-api).
 *
 * This is the ONLY app-notification trigger student-lms owns — delivery happens on
 * experience-api. Env (student-lms):
 * - EXPERIENCE_API_BASE_URL — e.g. https://api.example.com or http://localhost:4000 (no trailing slash)
 * - COMMUNITY_MASAIVERSE_INTERNAL_SECRET — must match experience-api COMMUNITY_MASAIVERSE_INTERNAL_SECRET
 */
const HEADER = 'x-community-masaiverse-secret'
/** Bounds the internal call so reply creation never hangs on a slow/unreachable experience-api. */
const REQUEST_TIMEOUT_MS = 4000

function baseUrl(): string | null {
  const raw = process.env.EXPERIENCE_API_BASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '')
}

function secret(): string | null {
  const s = process.env.COMMUNITY_MASAIVERSE_INTERNAL_SECRET?.trim()
  return s || null
}

/**
 * Notifies a post's author that someone replied, via experience-api. Works for both
 * public (community) and club discussions: `clubId` is sent only for club posts, while
 * `postId` is always included so the app can deep-link to the discussion. Never throws —
 * a notification failure must not break the reply it accompanies.
 */
export async function notifyDiscussionReplyViaExperienceApi(payload: {
  postId: string | number
  recipientUserId: number
  actorUserId: number
  replyPreview: string
  clubId?: number | null
  notificationType?: string
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
        reply_preview: payload.replyPreview,
        notification_type: payload.notificationType ?? 'discussion-reply-received',
        ...(payload.clubId != null ? { club_id: payload.clubId } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[communityMasaiverse] reply notify HTTP', res.status, text.slice(0, 200))
    }
  } catch (e) {
    console.warn('[communityMasaiverse] reply notify failed', e)
  }
}
