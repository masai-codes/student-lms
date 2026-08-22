import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { UndoCancelEnrolmentInput } from '@/server/api/webhooks/admissions/undoCancelEnrolment.schema'
import type { UndoCancelEnrolmentResult } from '@/server/api/webhooks/admissions/types'
import { BATCH_USER_STATUS } from '@/server/api/webhooks/admissions/types'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { reviveCancelledBatchUser } from '@/server/api/webhooks/admissions/steps/reviveCancelledBatchUser'
import { reviveCancelledSectionUsers } from '@/server/api/webhooks/admissions/steps/reviveCancelledSectionUsers'
import { invalidatePortalEnrollmentCache } from '@/server/batches/portalEnrollmentCache'

const FN = 'undoCancelEnrolmentFromAdmissions'

/** A row a cancel left behind: soft-deleted and/or flagged cancelled. */
function isCancelled(row: { status: string | null; deletedAt: string | null }) {
  return row.deletedAt != null || row.status === BATCH_USER_STATUS.CANCELLED
}

/**
 * Reverses a cancel-enrolment, restoring the state create-enrolment left:
 *
 *   1. locate the batch_user by its enrolment_id — same lookup and same
 *      `client` / `batch_id` scopes as cancel, so undo addresses exactly the row
 *      cancel would have (404 if unknown)
 *   2. if it is already live, stop — report `alreadyActive` and change nothing
 *   3. otherwise revive it (clear `deleted_at`, status back to active, drop the
 *      `batchEnrolmentCancelled` restriction flags)
 *   4. revive the section_users in that batch the cancel soft-deleted
 *
 * All writes run in one transaction; the student's cached enrolment sets are
 * dropped afterwards so the batch reappears on the next request instead of after
 * the 1h TTL. Replaying the webhook is a no-op, not a second revive.
 *
 * Note this is not a mirror of create-enrolment: it revives nothing that a
 * cancel did not remove, and never creates a batch_user or section_user.
 */
export async function undoCancelEnrolmentFromAdmissions(
  input: UndoCancelEnrolmentInput,
): Promise<UndoCancelEnrolmentResult> {
  logger.info({
    msg: 'Processing admissions enrolment undo-cancel',
    fn: FN,
    enrolmentId: input.enrolment_id,
    batchId: input.batch_id,
  })

  const result = await db.transaction(async (tx) => {
    const batchUserRow = await findBatchUserByEnrolmentId(tx, {
      enrolmentId: input.enrolment_id,
      // `null` from admissions means "not specified" — same as omitted.
      client: input.client ?? undefined,
      batchId: input.batch_id ?? undefined,
    })

    const base = {
      batchUserId: batchUserRow.id,
      userId: batchUserRow.userId,
      batchId: batchUserRow.batchId,
    }

    if (!isCancelled(batchUserRow)) {
      logger.info({
        msg: 'Enrolment is already active; nothing to undo',
        fn: FN,
        enrolmentId: input.enrolment_id,
        batchUserId: batchUserRow.id,
      })
      return { ...base, revivedSectionUserIds: [], alreadyActive: true }
    }

    await reviveCancelledBatchUser(tx, {
      batchUserId: batchUserRow.id,
      meta: batchUserRow.meta,
      history: batchUserRow.history,
      payload: { ...input },
    })

    const revivedSectionUserIds = await reviveCancelledSectionUsers(tx, {
      userId: batchUserRow.userId,
      batchId: batchUserRow.batchId,
    })

    return { ...base, revivedSectionUserIds, alreadyActive: false }
  })

  // Post-commit: the cached sets were built while the batch was cancelled, so
  // drop them for this user. Never throws. Runs even on the already-active path
  // — that costs one cache delete and protects against a cache built from a
  // half-applied earlier state.
  await invalidatePortalEnrollmentCache(result.userId)

  logger.info({
    msg: 'Enrolment cancel undone successfully',
    fn: FN,
    enrolmentId: input.enrolment_id,
    batchUserId: result.batchUserId,
    alreadyActive: result.alreadyActive,
    revivedSectionCount: result.revivedSectionUserIds.length,
  })

  return result
}
