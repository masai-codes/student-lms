import { and, eq } from 'drizzle-orm'

import { userBatchAdmissionData } from '@/db/schema'
import { logger } from '@/lib/logger'
import { ApiError } from '@/server/api/http/apiError'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

type Params = {
  userId: number
  batchId: number
  fullFeesPaid: boolean
}

/**
 * Set `full_fees_paid` on the user's `user_batch_admission_data` row for this
 * batch. Throws `ADMISSION_DATA_NOT_FOUND` (404) when no admission-data row
 * exists (it is created only during a new-user-journey enrolment).
 */
export async function updateFullFeesPaid(
  tx: DbTransaction,
  { userId, batchId, fullFeesPaid }: Params,
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
      msg: 'No admission data to record full payment against',
      fn: 'updateFullFeesPaid',
      userId,
      batchId,
    })
    throw new ApiError(404, 'ADMISSION_DATA_NOT_FOUND')
  }

  const now = new Date().toISOString()
  await tx
    .update(userBatchAdmissionData)
    .set({ fullFeesPaid: fullFeesPaid ? 1 : 0, updatedAt: now })
    .where(eq(userBatchAdmissionData.id, row.id))
}
