import { db } from '@/db'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type {
  CreateEnrolmentInput,
  CreateEnrolmentResult,
} from '@/server/api/webhooks/admissions/types'
import { assertActiveBatchExists } from '@/server/api/webhooks/admissions/steps/assertActiveBatchExists'
import { resolveValidSections } from '@/server/api/webhooks/admissions/steps/resolveValidSections'
import { resolveEnrolmentUser } from '@/server/api/webhooks/admissions/steps/resolveEnrolmentUser'
import { applyPortalNewLmsDefaults } from '@/server/api/webhooks/admissions/steps/applyPortalNewLmsDefaults'
import { reviveOrCreateBatchUser } from '@/server/api/webhooks/admissions/steps/reviveOrCreateBatchUser'
import { reviveOrCreateSectionUsers } from '@/server/api/webhooks/admissions/steps/reviveOrCreateSectionUsers'
import { upsertAdmissionData } from '@/server/api/webhooks/admissions/steps/upsertAdmissionData'
import { redactEnrolmentPayload } from '@/server/api/webhooks/admissions/utils/redactPayload'
import { resolveClient } from '@/server/api/webhooks/admissions/utils/resolveClient'
import { invalidatePortalEnrollmentCache } from '@/server/batches/portalEnrollmentCache'

const FN = 'createEnrolmentFromAdmissions'

/**
 * Orchestrates a "create enrolment" event from the admissions platform. Reads a
 * developer as a table of contents — each step lives in its own file:
 *
 *   1. batch must be active + non-deleted
 *   2. keep only valid sections (invalid ones are reported, not fatal)
 *   3. find-or-create the student (by email + client)
 *   4. (iitj only) default the student's new-LMS-only meta flags
 *   5. revive-or-create the batch_user
 *   6. revive-or-create a section_user per valid section
 *   7. (new-user-journey only) record admission data
 *
 * Steps 3–7 run inside a single transaction so a partial enrolment can never
 * persist. Once it commits, the student's cached enrolment sets are dropped so
 * the new batch/sections show up on their next request instead of after the 1h
 * TTL. Returns the batch_user id plus any sections that were skipped.
 */
export async function createEnrolmentFromAdmissions(
  input: CreateEnrolmentInput,
): Promise<CreateEnrolmentResult> {
  const client = resolveClient(input)
  logger.info({
    msg: 'Processing admissions enrolment',
    fn: FN,
    email: input.email,
    batchId: input.batch_id,
    client,
  })

  await assertActiveBatchExists(input.batch_id)

  const { validSectionIds, invalidSectionIds } = await resolveValidSections(
    input.batch_id,
    input.section_ids,
  )
  if (validSectionIds.length === 0) {
    logger.error({
      msg: 'No valid sections for enrolment',
      fn: FN,
      batchId: input.batch_id,
      requestedSectionIds: input.section_ids,
      invalidSectionIds,
    })
    throw new ApiError(422, 'NO_VALID_SECTIONS')
  }

  const { userId, batchUserId } = await db.transaction(async (tx) => {
    const resolvedUserId = await resolveEnrolmentUser(tx, input, client)
    await applyPortalNewLmsDefaults(tx, { userId: resolvedUserId, client })
    const createdBatchUserId = await reviveOrCreateBatchUser(tx, {
      userId: resolvedUserId,
      batchId: input.batch_id,
      client,
      enrolmentId: input.enrolment_id,
      username: input.username,
      payload: redactEnrolmentPayload(input),
    })
    await reviveOrCreateSectionUsers(tx, {
      userId: resolvedUserId,
      sectionIds: validSectionIds,
      // `null` from admissions means "no manager" — same as omitted.
      managerId: input.manager_id ?? undefined,
    })
    if (input.new_user_journey) {
      await upsertAdmissionData(tx, { userId: resolvedUserId, input })
    }
    return { userId: resolvedUserId, batchUserId: createdBatchUserId }
  })

  // Post-commit: `getBatchIdsForEnrolledUser` / `getSectionIdsForUser` cache the
  // pre-enrolment sets for an hour, so drop them now. Never throws.
  await invalidatePortalEnrollmentCache(userId)

  logger.info({
    msg: 'Enrolment processed successfully',
    fn: FN,
    userId,
    batchUserId,
    validSectionCount: validSectionIds.length,
    invalidSectionCount: invalidSectionIds.length,
  })

  return { userId, batchUserId, validSectionIds, invalidSectionIds }
}
