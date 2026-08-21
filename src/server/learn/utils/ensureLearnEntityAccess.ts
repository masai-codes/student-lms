import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { batches, sectionUser, sections } from '@/db/schema'
import { batchScopeForPortal } from '@/server/batches/portalBatchScope'

/**
 * A learner may open a learn-hub row (lecture / assignment / resource / problem /
 * feedback / discussion) ONLY if they are a member of the row's `section_id`.
 *
 * Section membership (`section_user`) is the single source of truth, matching the
 * old LMS's `lectureById` / `getAssignmentById` resolvers and the listing scope in
 * `getSectionIdsForUserInBatch`. Batch membership is deliberately NOT consulted:
 * `batch_user` is not reliably populated, so a user may be missing from it while
 * still legitimately belonging to a section (and vice versa). Gating on batch would
 * both wrongly deny real section members and wrongly grant access to lectures in a
 * sibling section of the same batch that the user never joined.
 */
export async function ensureUserCanAccessLearnHubEntity(
  userId: number,
  sectionId: number | null,
): Promise<boolean> {
  if (sectionId == null) {
    return false
  }

  const membership = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, sectionId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  return membership.length > 0
}

/**
 * The section IDs whose learn-hub rows `userId` may open within `batchId` — the
 * listing-side counterpart of {@link ensureUserCanAccessLearnHubEntity}.
 *
 * Any surface that lists learn-hub rows must scope on THIS, not on `batch_id`.
 * Scoping a listing by batch while the detail page gates by section is what let
 * a sibling section's public discussion appear in the batch feed and then fail
 * with "this item isn't available" on click: batches like the catch-all "Masai"
 * batch hold hundreds of unrelated sections.
 *
 * The predicate here is deliberately identical to the gate's (a live
 * `section_user` row in a live section), so everything listed is guaranteed to
 * open. Do NOT swap this for `getSectionIdsForUserInBatch` — that helper
 * intentionally ignores `section_user.deleted_at` to match a legacy scope, which
 * would reintroduce the same listed-but-not-openable mismatch for revoked
 * enrolments.
 */
export async function getAccessibleSectionIdsForUserInBatch(
  userId: number,
  batchId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ sectionId: sections.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .innerJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
        batchScopeForPortal(),
      ),
    )

  return [...new Set(rows.map((row) => row.sectionId))]
}
