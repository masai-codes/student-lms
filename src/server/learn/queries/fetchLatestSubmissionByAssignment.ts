import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { AssignmentSubmissionProgress } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { db } from '@/db'
import { submissions } from '@/db/schema'

/**
 * Latest submission flags per assignment for a user (newest by `created_at`
 * wins). Feeds `calculateAssignmentProgressStatus`. Reused by the learn listing
 * and the dashboard schedule.
 */
export async function fetchLatestSubmissionByAssignment(
  userId: number,
  assignmentIds: Array<number>,
): Promise<Map<number, AssignmentSubmissionProgress>> {
  if (assignmentIds.length === 0) return new Map()

  const rows = await db
    .select({
      assignmentId: submissions.assignmentId,
      completed: submissions.completed,
      status: submissions.status,
      markAsCompleted: submissions.markAsCompleted,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        isNull(submissions.deletedAt),
        inArray(submissions.assignmentId, assignmentIds),
      ),
    )
    .orderBy(desc(submissions.createdAt))

  const byAssignment = new Map<number, AssignmentSubmissionProgress>()
  for (const row of rows) {
    if (!byAssignment.has(row.assignmentId)) {
      byAssignment.set(row.assignmentId, {
        completed: row.completed === 1,
        status: row.status ?? null,
        markAsCompleted: row.markAsCompleted === 1,
      })
    }
  }
  return byAssignment
}
