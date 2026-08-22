import { and, eq, isNotNull } from 'drizzle-orm'

import { sections, sectionUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  ENROLMENT_EVENT,
  type DbTransaction,
} from '@/server/api/webhooks/admissions/types'
import { appendSectionHistory } from '@/server/api/webhooks/admissions/utils/history'

const FN = 'reviveCancelledSectionUsers'

type Params = {
  userId: number
  batchId: number
}

/** Was this `section_user` deleted by an enrolment cancel (and not by anything
 * since)? `meta.history` is append-only, so the last entry is the row's current
 * state: `cancelled` means the cancel flow soft-deleted it. */
function wasCancelledByEnrolmentCancel(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false
  const history = (meta as { history?: unknown }).history
  if (!Array.isArray(history) || history.length === 0) return false
  const last = history[history.length - 1] as { type?: unknown } | null
  return last?.type === ENROLMENT_EVENT.CANCELLED
}

/**
 * Revive the `section_user` rows in this batch that a cancel soft-deleted:
 * clear `deleted_at` and append a `revived` entry to `meta.history`. Returns the
 * ids that were revived.
 *
 * Only rows whose *last* history entry is `cancelled` are touched. A
 * `section_user` has no status column — "deleted" is just `deleted_at IS NOT
 * NULL` — so without that check an undo would also resurrect rows an admin or a
 * batch transfer removed for unrelated reasons, silently re-enrolling the
 * student into sections the cancel never touched. Rows already live are left
 * alone, which makes a replayed webhook a no-op.
 */
export async function reviveCancelledSectionUsers(
  tx: DbTransaction,
  { userId, batchId }: Params,
): Promise<number[]> {
  const now = new Date().toISOString()

  const rows = await tx
    .select({ id: sectionUser.id, meta: sectionUser.meta })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNotNull(sectionUser.deletedAt),
      ),
    )

  const revivedIds: number[] = []
  for (const row of rows) {
    if (!wasCancelledByEnrolmentCancel(row.meta)) continue
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
    revivedIds.push(row.id)
  }

  logger.info({
    msg: 'Revived cancelled section_users for enrolment',
    fn: FN,
    userId,
    batchId,
    candidateCount: rows.length,
    revivedCount: revivedIds.length,
  })

  return revivedIds
}
