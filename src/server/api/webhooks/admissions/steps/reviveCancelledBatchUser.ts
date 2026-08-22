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

const FN = 'reviveCancelledBatchUser'

/** The cancel flags a revive clears by absence (the restriction reader treats a
 * missing key as "not cancelled"), mirroring `reviveOrCreateBatchUser`. */
const CANCEL_META_KEYS = [
  'batchEnrolmentCancelled',
  'batchEnrolmentCancelledDate',
]

type Params = {
  batchUserId: number
  meta: string | null
  history: Record<string, unknown> | null
  /** The undo-cancel payload, stored in the admissionPayloadHistory audit trail. */
  payload: Record<string, unknown>
}

/**
 * Undo a cancel on a `batch_user`: clear `deleted_at`, flip it back to active,
 * and drop the `batchEnrolmentCancelled` meta keys so the restrictions layer
 * stops hiding the batch. A `revived` entry is appended to `history.timeline`
 * and the payload to `history.admissionPayloadHistory`, so the timeline keeps
 * the full cancel → revive trail exactly as a re-enrol would.
 *
 * The write is unconditional — callers decide whether the row needs it (an
 * already-live row is skipped by the service, so a replayed webhook does not
 * pile up timeline noise).
 */
export async function reviveCancelledBatchUser(
  tx: DbTransaction,
  { batchUserId, meta, history, payload }: Params,
): Promise<void> {
  const now = new Date().toISOString()

  const withEvent = appendTimelineEntry(history, {
    type: ENROLMENT_EVENT.REVIVED,
    date: now,
  })

  await tx
    .update(batchUser)
    .set({
      deletedAt: null,
      isActive: 1,
      status: BATCH_USER_STATUS.ACTIVE,
      meta: buildBatchUserMeta(meta, {}, CANCEL_META_KEYS),
      history: appendAdmissionPayload(withEvent, {
        type: ADMISSION_PAYLOAD_TYPE.UNDO_CANCEL,
        date: now,
        payload,
      }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))

  logger.info({
    msg: 'Revived cancelled batch_user',
    fn: FN,
    batchUserId,
  })
}
