import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { sectionUser, sections } from "@/db/schema";

/**
 * Resolves batch IDs for a user via section enrollment (section_user → sections.batch_id).
 * Prefer this over batch_user when batch_user data is unreliable.
 */
export async function getBatchIdsForEnrolledUser(
  userId: number,
): Promise<number[]> {
  const rows = await db
    .select({ batchId: sections.batchId })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
      ),
    );

  return [...new Set(rows.map((r) => r.batchId))];
}
