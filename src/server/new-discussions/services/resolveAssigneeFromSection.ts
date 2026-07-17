import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { sectionUser } from '@/db/schema'

/** Prefer section manager when present; otherwise the instructor/host user id. */
export async function resolveAssigneeFromSection(
  studentUserId: number,
  sectionId: number | null,
  fallbackInstructorUserId: number,
): Promise<number> {
  if (sectionId == null) {
    return fallbackInstructorUserId
  }

  const rows = await db
    .select({ managerId: sectionUser.managerId })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.sectionId, sectionId),
        eq(sectionUser.userId, studentUserId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  const managerId = rows.at(0)?.managerId
  if (managerId != null && managerId > 0) {
    return managerId
  }

  return fallbackInstructorUserId
}
