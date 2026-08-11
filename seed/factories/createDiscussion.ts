import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { discussions } from '@/db/schema'
import { formatMysqlDatetime } from '../utils/time'

type DiscussionInsert = typeof discussions.$inferInsert
type DiscussionSelect = typeof discussions.$inferSelect

export type CreateDiscussionOverrides = Partial<Omit<DiscussionInsert, 'id'>>

export async function createDiscussion(
  overrides: CreateDiscussionOverrides = {},
): Promise<DiscussionSelect> {
  const { entityType, entityId, userId } = overrides
  if (entityType == null || entityId == null || userId == null) {
    throw new Error(
      'createDiscussion requires entityType, entityId, and userId',
    )
  }

  const values: DiscussionInsert = {
    title: 'Seeded discussion',
    message: 'Seeded discussion message.',
    public: 0,
    isClosed: 0,
    createdAt: formatMysqlDatetime(new Date()),
    updatedAt: formatMysqlDatetime(new Date()),
    ...overrides,
    entityType,
    entityId,
    userId,
  }

  const [result] = await db.insert(discussions).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(discussions)
    .where(eq(discussions.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load discussion after insert (id=${id})`)
  }

  return row
}
