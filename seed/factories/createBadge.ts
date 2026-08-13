import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { badges } from '@/db/schema'

type BadgeInsert = typeof badges.$inferInsert
type BadgeSelect = typeof badges.$inferSelect

export type CreateBadgeOverrides = Partial<Omit<BadgeInsert, 'id'>>

/**
 * Inserts a `badges` row — the badge *definition* (art + copy), independent of
 * any cohort. Pair it with `createBadgeConfig` to attach it to a section, and
 * `createUserBadge` to award it.
 */
export async function createBadge(
  overrides: CreateBadgeOverrides = {},
): Promise<BadgeSelect> {
  const values: BadgeInsert = {
    title: 'Demo Badge',
    description: 'Awarded for completing a demo milestone.',
    image:
      'https://coding-platform.s3.amazonaws.com/dev/lms/badges/demo-badge.png',
    linkedinShareText: 'I earned the Demo Badge at Masai.',
    lockedBadgeDescription: 'Complete the demo milestone to unlock this badge.',
    theme: 'theme1',
    ...overrides,
  }

  const [result] = await db.insert(badges).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(badges).where(eq(badges.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load badge after insert (id=${id})`)
  }

  return row
}
