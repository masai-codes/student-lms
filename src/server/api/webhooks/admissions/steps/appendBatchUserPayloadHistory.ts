import { eq } from 'drizzle-orm'

import { batchUser } from '@/db/schema'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'
import { appendAdmissionPayload } from '@/server/api/webhooks/admissions/utils/history'

type Params = {
  batchUserId: number
  history: Record<string, unknown> | null
  type: string
  payload: Record<string, unknown>
}

/**
 * Append a received webhook payload to `batch_user.history.admissionPayloadHistory`
 * without touching any other column. Used by webhooks whose only change to the
 * batch_user row is the audit-trail entry.
 */
export async function appendBatchUserPayloadHistory(
  tx: DbTransaction,
  { batchUserId, history, type, payload }: Params,
): Promise<void> {
  const now = new Date().toISOString()
  await tx
    .update(batchUser)
    .set({
      history: appendAdmissionPayload(history, { type, date: now, payload }),
      updatedAt: now,
    })
    .where(eq(batchUser.id, batchUserId))
}
