import { and, eq, inArray } from 'drizzle-orm'

import { sectionUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  ENROLMENT_EVENT,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import {
  appendSectionHistory,
  newSectionHistory,
} from '@/server/api/webhooks/admissions/utils/history'

const FN = 'reviveOrCreateSectionUsers'

type Params = {
  userId: number
  sectionIds: number[]
  managerId?: number
}

/**
 * Ensure the user has a live `section_user` row for every valid section.
 * A `section_user` is "active" purely by `deleted_at IS NULL` (there is no
 * status column), so reviving means clearing `deleted_at`. Each create/revive
 * appends to the `meta.history` audit array.
 */
export async function reviveOrCreateSectionUsers(
  tx: DbTransaction,
  { userId, sectionIds, managerId }: Params,
): Promise<void> {
  const now = new Date().toISOString()

  const existing = await tx
    .select({
      id: sectionUser.id,
      sectionId: sectionUser.sectionId,
      meta: sectionUser.meta,
    })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        inArray(sectionUser.sectionId, sectionIds),
      ),
    )

  const existingBySection = new Map(existing.map((row) => [row.sectionId, row]))

  for (const sectionId of sectionIds) {
    const row = existingBySection.get(sectionId)
    if (row) {
      await tx
        .update(sectionUser)
        .set({
          deletedAt: null,
          updatedAt: now,
          meta: appendSectionHistory(row.meta, {
            type: ENROLMENT_EVENT.REVIVED,
            date: now,
          }),
        })
        .where(eq(sectionUser.id, row.id))

      logger.info({
        msg: 'Revived section_user for enrolment',
        fn: FN,
        sectionUserId: row.id,
        userId,
        sectionId,
      })
      continue
    }

    await tx.insert(sectionUser).values({
      userId,
      sectionId,
      managerId: managerId ?? null,
      role: 'student',
      meta: newSectionHistory({ type: ENROLMENT_EVENT.CREATED, date: now }),
      createdAt: now,
      updatedAt: now,
    })

    logger.info({
      msg: 'Created section_user for enrolment',
      fn: FN,
      userId,
      sectionId,
    })
  }
}
