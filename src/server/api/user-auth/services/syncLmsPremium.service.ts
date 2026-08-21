import { findCurrentLmsBatch } from '@/server/api/user-auth/services/findCurrentLmsBatch.service'
import type { MasaiLiveUser } from '@/server/api/user-auth/services/resolveMasaiLiveConnectSid.service'
import { logger } from '@/lib/logger'

const FN = 'syncLmsPremium'

function masaiLiveApiBase(): string {
  return (process.env.MASAI_LIVE_API_BASE || '').trim().replace(/\/$/, '')
}

function internalKey(): string {
  return (process.env.LMS_MASAI_LIVE_INTERNAL_KEY || '').trim()
}

function isLmsPremiumSyncConfigured(): boolean {
  return Boolean(masaiLiveApiBase() && internalKey())
}

/**
 * Grant or revoke Masai Live `lms_active_batch` after SSO.
 * Never throws — login must succeed even if this call fails.
 */
export async function syncLmsPremiumForMasaiLiveLogin(input: {
  user: MasaiLiveUser
  connectSid?: string | null
}): Promise<void> {
  if (!isLmsPremiumSyncConfigured()) return

  const email = (input.user.email || '').trim().toLowerCase()
  if (!email) {
    logger.warn({ msg: 'LMS premium sync skipped: user has no email', fn: FN })
    return
  }

  try {
    const batch = await findCurrentLmsBatch(input.user.id)
    const action = batch ? 'grant' : 'revoke'

    if (action === 'grant' && !input.connectSid) {
      logger.info({
        msg: 'LMS premium sync skipped grant: no connectSid',
        fn: FN,
        userId: input.user.id,
      })
      return
    }

    const res = await fetch(`${masaiLiveApiBase()}/internal/lms-premium/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': internalKey(),
      },
      body: JSON.stringify({
        action,
        email,
        lms_user_id: String(input.user.id),
        ...(batch ? { batch_id: batch.id, batch_name: batch.name } : {}),
        ...(input.connectSid ? { connect_sid: input.connectSid } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      logger.warn({
        msg: 'LMS premium sync returned non-OK',
        fn: FN,
        userId: input.user.id,
        status: res.status,
      })
    }
  } catch (error) {
    logger.warn({
      msg: 'LMS premium sync failed (SSO continues)',
      fn: FN,
      err: error,
    })
  }
}
