import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { userBadges } from '@/db/schema'

import { formatMysqlDate } from '../utils/time'

type UserBadgeInsert = typeof userBadges.$inferInsert
type UserBadgeSelect = typeof userBadges.$inferSelect

export type CreateUserBadgeOverrides = Partial<Omit<UserBadgeInsert, 'id'>>

/**
 * Inserts a `user_badges` row — one *award* of a badge to a student.
 *
 * The unique key is `(user_id, badge_id, badge_config_id)`, so seeding a repeat
 * award (to exercise the profile's `xN` count) needs a distinct badge/config.
 */
export async function createUserBadge(
  overrides: CreateUserBadgeOverrides = {},
): Promise<UserBadgeSelect> {
  const { userId, badgeId, badgeConfigId } = overrides
  if (userId == null || badgeId == null || badgeConfigId == null) {
    throw new Error(
      'createUserBadge requires userId, badgeId and badgeConfigId',
    )
  }

  const values: UserBadgeInsert = {
    releaseDate: formatMysqlDate(new Date()),
    ...overrides,
    userId,
    badgeId,
    badgeConfigId,
  }

  const [result] = await db.insert(userBadges).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load user badge after insert (id=${id})`)
  }

  return row
}
