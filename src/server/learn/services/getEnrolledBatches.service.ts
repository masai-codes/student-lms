import { and, desc, inArray, isNull } from 'drizzle-orm'
import type { EnrolledBatch, EnrolledBatchRow } from '@/server/learn/types'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { mapEnrolledBatchRow } from '@/server/learn/utils/mapEnrolledBatchRow'

export async function getEnrolledBatchesForUser(userId: number): Promise<Array<EnrolledBatch>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  if (batchIds.length === 0) {
    return []
  }

  const rows: Array<EnrolledBatchRow> = await db
    .select({
      id: batches.id,
      name: batches.name,
    })
    .from(batches)
    .where(and(inArray(batches.id, batchIds), isNull(batches.deletedAt)))
    .orderBy(desc(batches.createdAt))

  return rows.map(mapEnrolledBatchRow)
}
