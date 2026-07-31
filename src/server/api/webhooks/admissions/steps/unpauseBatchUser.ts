import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  ADMISSION_PAYLOAD_TYPE,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { buildBatchUserMeta } from '@/server/api/webhooks/admissions/utils/batchUserMeta'
import { appendAdmissionPayload } from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  batchUserId: number
  meta: string | null
  history: Record<string, unknown> | null
  payload: Record<string, unknown>
}

/**
 * Unpause a batch enrolment by removing the `batchPaused` / `batchPausedDate`
 * keys from `meta` (absence = not paused, so we delete rather than store
 * `false`) and appending the payload to the audit trail. Any other meta keys
 * (e.g. `isIhub`) are preserved.
 */
export async function unpauseBatchUser(
  tx: DbTransaction,
  { batchUserId, meta, history, payload }: Params,
): Promise<void> {
  const now = new Date().toISOString()
  await tx
    .update(batchUser)
    .set({
      meta: buildBatchUserMeta(meta, {}, ['batchPaused', 'batchPausedDate']),
      history: appendAdmissionPayload(history, {
        type: ADMISSION_PAYLOAD_TYPE.BATCH_UNPAUSED,
        date: now,
        payload,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Unpaused batch enrolment',
    fn: 'unpauseBatchUser',
    batchUserId,
  })
}
