import { and, eq, isNull, ne } from 'drizzle-orm'
import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'

/** Load the learn entity title when a ticket is raised from a detail page. */
export async function fetchEntityTitleForTicket(input: {
  userId: number
  category: string
  entityId: number
}): Promise<string | null> {
  try {
    if (input.category === 'lecture' || input.category === 'resource') {
      const rows = await db
        .select({
          title: lectures.title,
          sectionId: lectures.sectionId,
        })
        .from(lectures)
        .where(
          and(
            eq(lectures.id, input.entityId),
            isNull(lectures.deletedAt),
            input.category === 'resource'
              ? eq(lectures.type, LECTURE_RESOURCE_TYPE)
              : ne(lectures.type, LECTURE_RESOURCE_TYPE),
          ),
        )
        .limit(1)
      const row = rows[0]
      if (!row) return null
      const allowed = await ensureUserCanAccessLearnHubEntity(
        input.userId,
        row.sectionId,
      )
      return allowed ? row.title.trim() || null : null
    }

    if (input.category === 'assignment' || input.category === 'evaluation') {
      const rows = await db
        .select({
          title: assignments.title,
          sectionId: assignments.sectionId,
          type: assignments.type,
        })
        .from(assignments)
        .where(
          and(eq(assignments.id, input.entityId), isNull(assignments.deletedAt)),
        )
        .limit(1)
      const row = rows[0]
      if (!row) return null
      if (
        input.category === 'evaluation' &&
        row.type.trim().toLowerCase() !== 'evaluation'
      ) {
        return null
      }
      const allowed = await ensureUserCanAccessLearnHubEntity(
        input.userId,
        row.sectionId,
      )
      return allowed ? row.title.trim() || null : null
    }

    return null
  } catch (error) {
    console.error('[support] entity title lookup failed', error)
    return null
  }
}
