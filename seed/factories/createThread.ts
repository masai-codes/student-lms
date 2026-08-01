import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { threads } from '@/db/schema'
import { formatMysqlDatetime } from '../utils/time'

type ThreadInsert = typeof threads.$inferInsert
type ThreadSelect = typeof threads.$inferSelect

export type CreateThreadOverrides = Partial<Omit<ThreadInsert, 'id'>>

export async function createThread(
  overrides: CreateThreadOverrides = {},
): Promise<ThreadSelect> {
  const { discussionId, userId } = overrides
  if (discussionId == null || userId == null) {
    throw new Error('createThread requires discussionId and userId')
  }

  const values: ThreadInsert = {
    message: 'Seeded thread reply.',
    public: 1,
    createdAt: formatMysqlDatetime(new Date()),
    updatedAt: formatMysqlDatetime(new Date()),
    ...overrides,
    discussionId,
    userId,
  }

  const [result] = await db.insert(threads).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load thread after insert (id=${id})`)
  }

  return row
}
