import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { sectionUser, sections } from '@/db/schema'

/**
 * All (non-deleted) section IDs a user belongs to, resolved directly via
 * `section_user → sections`. This is the reusable "which sections am I in?"
 * primitive — prefer it over ad-hoc joins.
 */
export async function getSectionIdsForUser(
  userId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(and(eq(sectionUser.userId, userId), isNull(sections.deletedAt)))

  return [...new Set(rows.map((row) => row.sectionId))]
}
