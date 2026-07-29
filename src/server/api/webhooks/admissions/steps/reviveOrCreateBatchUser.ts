import { and, eq } from 'drizzle-orm'

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
  newTimeline,
} from '@/server/api/webhooks/admissions/utils/history'

const FN = 'reviveOrCreateBatchUser'

type Params = {
  userId: number
  batchId: number
  isIhub: boolean
  enrolmentId: number
  username: string
  /** Redacted enrolment payload, stored in the admissionPayloadHistory audit trail. */
  payload: Record<string, unknown>
}

/**
 * Ensure the user has a live `batch_user` row for this batch.
 * - Existing row → revive it (clear `deleted_at`, set `is_active = 1`) and append
 *   a `revived` entry to `history.timeline`.
 * - No row → insert one with a `created` timeline entry.
 *
 * `meta` is a `varchar(300)` JSON string here. Writes merge into it (preserving
 * other keys like `batchPaused`) rather than overwriting: create/revive refresh
 * `isIhub` and, on revive, drop the enrolment-cancel keys so a re-enrol lifts
 * the restriction a prior cancel set (absence = not cancelled, so we remove the
 * keys instead of storing `false`). Returns the `batch_user` id.
 */
export async function reviveOrCreateBatchUser(
  tx: DbTransaction,
  { userId, batchId, isIhub, enrolmentId, username, payload }: Params,
): Promise<number> {
  const now = new Date().toISOString()
  // On revive, clear a prior cancel by removing its keys (absence = not cancelled).
  const CANCEL_META_KEYS = [
    'batchEnrolmentCancelled',
    'batchEnrolmentCancelledDate',
  ]
  const payloadEntry = {
    type: ADMISSION_PAYLOAD_TYPE.ENROLMENT,
    date: now,
    payload,
  }

  const existing = await tx
    .select({
      id: batchUser.id,
      meta: batchUser.meta,
      history: batchUser.history,
    })
    .from(batchUser)
    .where(and(eq(batchUser.userId, userId), eq(batchUser.batchId, batchId)))
    .limit(1)

  const row = existing.at(0)
  if (row) {
    const withEvent = appendTimelineEntry(row.history, {
      type: ENROLMENT_EVENT.REVIVED,
      date: now,
    })
    await tx
      .update(batchUser)
      .set({
        deletedAt: null,
        isActive: 1,
        status: BATCH_USER_STATUS.ACTIVE,
        enrolmentId,
        username,
        meta: buildBatchUserMeta(row.meta, { isIhub }, CANCEL_META_KEYS),
        history: appendAdmissionPayload(withEvent, payloadEntry),
        updatedAt: now,
      })
      .where(eq(batchUser.id, row.id))

    logger.info({
      msg: 'Revived batch_user for enrolment',
      fn: FN,
      batchUserId: row.id,
      userId,
      batchId,
    })
    return row.id
  }

  const [result] = await tx.insert(batchUser).values({
    userId,
    batchId,
    role: 'student',
    isActive: 1,
    status: BATCH_USER_STATUS.ACTIVE,
    enrolmentId,
    username,
    meta: buildBatchUserMeta(null, { isIhub }),
    history: appendAdmissionPayload(
      newTimeline({ type: ENROLMENT_EVENT.CREATED, date: now }),
      payloadEntry,
    ),
    createdAt: now,
    updatedAt: now,
  })

  const batchUserId = Number(result.insertId)
  logger.info({
    msg: 'Created batch_user for enrolment',
    fn: FN,
    batchUserId,
    userId,
    batchId,
  })
  return batchUserId
}
