import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  ADMISSION_PAYLOAD_TYPE,
  BATCH_USER_STATUS,
  ENROLMENT_EVENT,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { buildBatchUserMeta } from '@/server/api/webhooks/admissions/utils/batchUserMeta'
import {
  appendAdmissionPayload,
  appendTimelineEntry,
} from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  batchUserId: number
  meta: string | null
  history: Record<string, unknown> | null
  /** The cancel payload, stored in the admissionPayloadHistory audit trail. */
  payload: Record<string, unknown>
}

/**
 * Cancel a `batch_user`: soft-delete it (`deleted_at = now`), flip it inactive
 * with a cancelled status, set the `batchEnrolmentCancelled` restriction flag +
 * date in `meta` (the keys the restrictions layer reads), and append a
 * `cancelled` entry to `history.timeline`. A later create-enrolment revives it
 * (clearing `deleted_at`, the status, and the meta flag) — the timeline keeps
 * the full cancel/revive audit trail.
 */
export async function cancelBatchUser(
  tx: DbTransaction,
  { batchUserId, meta, history, payload }: Params,
): Promise<void> {
  const now = new Date().toISOString()

  const withEvent = appendTimelineEntry(history, {
    type: ENROLMENT_EVENT.CANCELLED,
    date: now,
  })

  await tx
    .update(batchUser)
    .set({
      deletedAt: now,
      isActive: 0,
      status: BATCH_USER_STATUS.CANCELLED,
      meta: buildBatchUserMeta(meta, {
        batchEnrolmentCancelled: true,
        batchEnrolmentCancelledDate: now,
      }),
      history: appendAdmissionPayload(withEvent, {
        type: ADMISSION_PAYLOAD_TYPE.CANCEL,
        date: now,
        payload,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Cancelled batch_user',
    fn: 'cancelBatchUser',
    batchUserId,
  })
}
