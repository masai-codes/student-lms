import { db } from '@/db'
import { logger } from '@/lib/logger'
import type { CancelEnrolmentInput } from '@/server/api/webhooks/admissions/cancelEnrolment.schema'
import type { CancelEnrolmentResult } from '@/server/api/webhooks/admissions/types'
import { cancelBatchUser } from '@/server/api/webhooks/admissions/steps/cancelBatchUser'
import { cancelSectionUsers } from '@/server/api/webhooks/admissions/steps/cancelSectionUsers'
import { findBatchUserByEnrolmentId } from '@/server/api/webhooks/admissions/steps/findBatchUserByEnrolmentId'
import { invalidatePortalEnrollmentCache } from '@/server/batches/portalEnrollmentCache'

const FN = 'cancelEnrolmentFromAdmissions'

/**
 * Cancels an enrolment the admissions platform previously created:
 *
 *   1. locate the batch_user by its enrolment_id (404 if unknown)
 *   2. soft-delete + mark the batch_user cancelled (timeline audit)
 *   3. soft-delete every active section_user in that batch (history audit)
 *
 * All writes run in one transaction. Mirrors create-enrolment: a subsequent
 * create-enrolment revives the batch_user and only the section_users whose ids
 * are in that payload, leaving the rest cancelled. Once the transaction commits
 * the student's cached enrolment sets are dropped, so the cancelled batch stops
 * being served from cache immediately rather than after the 1h TTL.
 */
export async function cancelEnrolmentFromAdmissions(
  input: CancelEnrolmentInput,
): Promise<CancelEnrolmentResult> {
  logger.info({
    msg: 'Processing admissions enrolment cancel',
    fn: FN,
    enrolmentId: input.enrolment_id,
  })

  const result = await db.transaction(async (tx) => {
    const batchUserRow = await findBatchUserByEnrolmentId(
      tx,
      input.enrolment_id,
    )

    await cancelBatchUser(tx, {
      batchUserId: batchUserRow.id,
      meta: batchUserRow.meta,
      history: batchUserRow.history,
      payload: { ...input },
    })

    const cancelledSectionUserIds = await cancelSectionUsers(tx, {
      userId: batchUserRow.userId,
      batchId: batchUserRow.batchId,
    })

    return {
      batchUserId: batchUserRow.id,
      userId: batchUserRow.userId,
      batchId: batchUserRow.batchId,
      cancelledSectionUserIds,
    }
  })

  // Post-commit: the cached batch/section sets still contain the cancelled
  // batch, so drop them for this user. Never throws.
  await invalidatePortalEnrollmentCache(result.userId)

  logger.info({
    msg: 'Enrolment cancelled successfully',
    fn: FN,
    enrolmentId: input.enrolment_id,
    batchUserId: result.batchUserId,
    cancelledSectionCount: result.cancelledSectionUserIds.length,
  })

  return result
}
