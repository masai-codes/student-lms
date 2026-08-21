import { and, inArray, isNull } from 'drizzle-orm'
import type { EnrolledBatch, EnrolledBatchRow } from '@/server/learn/types'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { mapEnrolledBatchRow } from '@/server/learn/utils/mapEnrolledBatchRow'

/**
 * The enrolled batches backing `/learn`'s course dropdown, ordered MOST RECENT
 * ENROLMENT FIRST.
 *
 * `getBatchIdsForEnrolledUser` returns oldest-enrolment-first and is shared with
 * surfaces that depend on that order (support directory, my-programs), so the
 * reversal lives here rather than in the shared query. Because the newest enrolment
 * is now index 0, the `[0]` fallbacks in `resolveSelectedBatchId` and the `/learn`
 * route also default to the student's latest course.
 */
export async function getEnrolledBatchesForUser(
  userId: number,
): Promise<Array<EnrolledBatch>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  if (batchIds.length === 0) {
    return []
  }

  const rows: Array<EnrolledBatchRow> = await db
    .select({
      id: batches.id,
      name: batches.name,
      meta: batches.meta,
      settings: batches.settings,
    })
    .from(batches)
    .where(and(inArray(batches.id, batchIds), isNull(batches.deletedAt)))

  const mappedRowsByBatchId = new Map(
    rows.map((row) => {
      const mapped = mapEnrolledBatchRow(row)
      return [mapped.batchId, mapped] as const
    }),
  )

  return batchIds
    .map((batchId) => mappedRowsByBatchId.get(batchId))
    .filter((batch): batch is EnrolledBatch => batch !== undefined)
    .reverse()
}
