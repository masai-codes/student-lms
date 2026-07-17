import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { userBatchAdmissionData } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type AdmissionInsert = typeof userBatchAdmissionData.$inferInsert
type AdmissionSelect = typeof userBatchAdmissionData.$inferSelect

export type CreateUserBatchAdmissionDataOverrides = Partial<
  Omit<AdmissionInsert, 'id'>
>

export async function createUserBatchAdmissionData(
  overrides: CreateUserBatchAdmissionDataOverrides = {},
): Promise<AdmissionSelect> {
  const { userId, batchId } = overrides
  if (userId == null || batchId == null) {
    throw new Error('createUserBatchAdmissionData requires userId and batchId')
  }

  const now = formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))
  const values: AdmissionInsert = {
    lmsAccessDate: now,
    fullFeesPaid: 0,
    updatedAt: now,
    ...overrides,
    userId,
    batchId,
  }

  const [result] = await db.insert(userBatchAdmissionData).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(userBatchAdmissionData)
    .where(eq(userBatchAdmissionData.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load admission data after insert (id=${id})`)
  }

  return row
}
