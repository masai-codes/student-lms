import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { sectionUser } from '@/db/schema'

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
