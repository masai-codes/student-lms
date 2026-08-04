import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { setBatchUserEnrolmentIdSchema } from '@/server/api/migrations/batch-user/setEnrolmentId.schema'
import { setBatchUserEnrolmentId } from '@/server/api/migrations/batch-user/setEnrolmentId.service'
import { verifyMigrationToken } from '@/server/api/migrations/http/verifyMigrationToken'

const FN = 'handleSetBatchUserEnrolmentId'

/**
 * POST /api/migrations/batch-user/set-enrolment-id
 *
 * Operator-run migration: find the `batch_user` row for a `(batch_id, user_id)`
 * pair and write `enrolment_id` onto it. Authorized with `SECRET_LOGIN_TOKEN` in
 * the `x-migration-token` header. Body:
 * `{ batch_id, user_id, enrolment_id, overwrite? }`. Returns
 * `{ batchUserId, batchId, userId, previousEnrolmentId, enrolmentId, updated }`.
 */
export async function handleSetBatchUserEnrolmentId(
  request: Request,
): Promise<Response> {
  try {
    verifyMigrationToken(request)

    const rawBody = await request.json().catch(() => ({}))
    const parsed = setBatchUserEnrolmentIdSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({
        msg: 'Rejected invalid set-enrolment-id payload',
        fn: FN,
        issues: parsed.error.issues,
      })
      throw new ApiError(
        400,
        'INVALID_MIGRATION_PAYLOAD',
        'batch_id, user_id and enrolment_id must be positive integers',
      )
    }

    const result = await setBatchUserEnrolmentId(parsed.data)
    return jsonOk(result)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error({
        msg: 'Unhandled set-enrolment-id migration failure',
        fn: FN,
        err: error,
      })
    }
    return mapThrownErrorToResponse(error)
  }
}
