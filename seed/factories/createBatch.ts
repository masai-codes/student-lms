import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { batches } from '@/db/schema'

import { DEFAULT_BATCH_NAME } from '../utils/constants'
import { formatMysqlDate, offsetFromNow } from '../utils/time'

type BatchInsert = typeof batches.$inferInsert
type BatchSelect = typeof batches.$inferSelect

export type CreateBatchOverrides = Partial<Omit<BatchInsert, 'id'>>

export async function createBatch(
  overrides: CreateBatchOverrides = {},
): Promise<BatchSelect> {
  const { meta: metaOverride, ...restOverrides } = overrides

  const values: BatchInsert = {
    name: DEFAULT_BATCH_NAME,
    starting: formatMysqlDate(offsetFromNow({ daysAgo: 0 })),
    duration: '30 weeks',
    program: 'FT',
    active: 1,
    // `interviews` drives which /interviews tracks the batch's students see
    // (see `resolveInterviewDomains`) — default to the generalist software
    // track unless a flow overrides it (e.g. a Data Science batch).
    meta: { interviews: ['fullstack'], ...metaOverride },
    ...restOverrides,
  }

  const [result] = await db.insert(batches).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(batches)
    .where(eq(batches.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load batch after insert (id=${id})`)
  }

  return row
}
