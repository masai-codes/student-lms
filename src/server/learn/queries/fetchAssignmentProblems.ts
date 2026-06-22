import { and, asc, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignmentProblem, problems, solutions } from '@/db/schema'

export type AssignmentProblemRow = {
  elementId: number
  problemId: number
  title: string
}

export type SolutionStatusRow = {
  problemId: number
  status: string | null
}

/** Non-deleted problems linked to an assignment, ordered by priority. */
export async function fetchAssignmentProblemRows(
  assignmentId: number,
): Promise<Array<AssignmentProblemRow>> {
  return db
    .select({
      elementId: assignmentProblem.id,
      problemId: problems.id,
      title: problems.title,
    })
    .from(assignmentProblem)
    .innerJoin(problems, eq(assignmentProblem.problemId, problems.id))
    .where(
      and(
        eq(assignmentProblem.assignmentId, assignmentId),
        isNull(assignmentProblem.deletedAt),
        isNull(problems.deletedAt),
      ),
    )
    .orderBy(asc(assignmentProblem.priority), asc(assignmentProblem.id))
}

/** Per-problem solution status for a given submission. */
export async function fetchSolutionStatusesBySubmission(
  submissionId: number,
): Promise<Array<SolutionStatusRow>> {
  return db
    .select({ problemId: solutions.problemId, status: solutions.status })
    .from(solutions)
    .where(
      and(eq(solutions.submissionId, submissionId), isNull(solutions.deletedAt)),
    )
}
