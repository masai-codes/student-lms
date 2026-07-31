import { and, eq } from 'drizzle-orm'

import { userBatchAdmissionData } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

type AdmissionDataValues = Partial<typeof userBatchAdmissionData.$inferInsert>

type Params = {
  userId: number
  batchId: number
  values: AdmissionDataValues
}

/**
 * Update the user's `user_batch_admission_data` row for a batch with the given
 * column `values` (plus `updated_at`). Throws `ADMISSION_DATA_NOT_FOUND` (404)
 * when there is no admission-data row (it is created only during a
 * new-user-journey enrolment). Shared by the paid / invoice / fee-deadline
 * events, each of which just supplies different columns.
 */
export async function updateAdmissionDataForBatch(
  tx: DbTransaction,
  { userId, batchId, values }: Params,
): Promise<void> {
  const rows = await tx
    .select({ id: userBatchAdmissionData.id })
    .from(userBatchAdmissionData)
    .where(
      and(
        eq(userBatchAdmissionData.userId, userId),
        eq(userBatchAdmissionData.batchId, batchId),
      ),
    )
    .limit(1)

  const row = rows.at(0)
  if (!row) {
    logger.warn({
      msg: 'No admission data to update',
      fn: 'updateAdmissionDataForBatch',
      userId,
      batchId,
    })
    throw new ApiError(404, 'ADMISSION_DATA_NOT_FOUND')
  }

  await tx
    .update(userBatchAdmissionData)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(userBatchAdmissionData.id, row.id))
}
