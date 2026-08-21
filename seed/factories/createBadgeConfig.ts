import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { badgeConfigs } from '@/db/schema'

type BadgeConfigInsert = typeof badgeConfigs.$inferInsert
type BadgeConfigSelect = typeof badgeConfigs.$inferSelect

export type CreateBadgeConfigOverrides = Partial<Omit<BadgeConfigInsert, 'id'>>

/**
 * Inserts a `badge_configs` row — a badge attached to one section of one batch.
 *
 * This is what makes a badge *visible* on the profile: the achievements service
 * lists every config on the student's enrolled sections, marking the ones with
 * no `user_badges` row as locked.
 */
export async function createBadgeConfig(
  overrides: CreateBadgeConfigOverrides = {},
): Promise<BadgeConfigSelect> {
  const { badgeId, batchId } = overrides
  if (badgeId == null || batchId == null) {
    throw new Error('createBadgeConfig requires badgeId and batchId')
  }

  const values: BadgeConfigInsert = {
    lectureCriteria: 'none',
    assignmentCriteria: 'none',
    ...overrides,
    badgeId,
    batchId,
  }

  const [result] = await db.insert(badgeConfigs).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(badgeConfigs)
    .where(eq(badgeConfigs.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load badge config after insert (id=${id})`)
  }

  return row
}
