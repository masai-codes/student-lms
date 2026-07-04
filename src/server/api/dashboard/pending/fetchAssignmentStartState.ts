import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { submissions } from '@/db/schema'

/**
 * The set of assignment ids the user has **begun** — meaning a non-deleted
 * submission row that is either `started = 1` OR has clicked through to the
 * external assessment platform (`data.assess_platform_link_clicked`). An
 * untouched/draft row (started false, no link click) does NOT count as begun,
 * so it stays pending — exactly like having no row at all.
 */
export async function fetchAssignmentStartState(
  userId: number,
  assignmentIds: Array<number>,
): Promise<Set<number>> {
  if (assignmentIds.length === 0) return new Set()

  const rows = await db
    .select({
      assignmentId: submissions.assignmentId,
      started: submissions.started,
      data: submissions.data,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        isNull(submissions.deletedAt),
        inArray(submissions.assignmentId, assignmentIds),
      ),
    )

  const begun = new Set<number>()
  for (const row of rows) {
    if (row.started === 1 || hasAssessPlatformLinkClick(row.data)) {
      begun.add(row.assignmentId)
    }
  }
  return begun
}

function hasAssessPlatformLinkClick(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'assess_platform_link_clicked' in data &&
      (data).assess_platform_link_clicked,
  )
}
