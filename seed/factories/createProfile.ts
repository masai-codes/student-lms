import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { profiles } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type ProfileInsert = typeof profiles.$inferInsert
type ProfileSelect = typeof profiles.$inferSelect

export type CreateProfileOverrides = Partial<Omit<ProfileInsert, 'id'>>

export async function createProfile(
  overrides: CreateProfileOverrides = {},
): Promise<ProfileSelect> {
  const { userId } = overrides
  if (userId == null) {
    throw new Error('createProfile requires userId')
  }

  const now = formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))
  const values: ProfileInsert = {
    updatedAt: now,
    ...overrides,
    userId,
  }

  const [result] = await db.insert(profiles).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load profile after insert (id=${id})`)
  }

  return row
}
