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
 * Pause a batch enrolment by setting the `batchPaused` / `batchPausedDate`
 * restriction keys in `meta` (the same keys `getUserBatchRestrictions` reads)
 * and appending the payload to the audit trail. Returns the pause date used.
 */
export async function pauseBatchUser(
  tx: DbTransaction,
  { batchUserId, meta, history, payload }: Params,
): Promise<string> {
  const now = new Date().toISOString()
  await tx
    .update(batchUser)
    .set({
      meta: buildBatchUserMeta(meta, {
        batchPaused: true,
        batchPausedDate: now,
      }),
      history: appendAdmissionPayload(history, {
        type: ADMISSION_PAYLOAD_TYPE.BATCH_PAUSED,
        date: now,
        payload,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Paused batch enrolment',
    fn: 'pauseBatchUser',
    batchUserId,
  })
  return now
}
