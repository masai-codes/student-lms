import { and, desc, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignmentProblem, problems, solutions, submissions } from '@/db/schema'

export type ProblemDetailRow = {
  elementId: number
  problemId: number
  title: string
  statement: string
  type: string
}

export type ProblemSolutionRow = {
  id: number
  submissionLink: string | null
  status: string | null
  submittedAt: string | null
}

/** The problem (with its assignment link row) for a given assignment + problem. */
export async function fetchAssignmentProblemDetailRow(
  assignmentId: number,
  problemId: number,
): Promise<ProblemDetailRow | null> {
  const rows = await db
    .select({
      elementId: assignmentProblem.id,
      problemId: problems.id,
      title: problems.title,
      statement: problems.statement,
      type: problems.type,
    })
    .from(assignmentProblem)
    .innerJoin(problems, eq(assignmentProblem.problemId, problems.id))
    .where(
      and(
        eq(assignmentProblem.assignmentId, assignmentId),
        eq(assignmentProblem.problemId, problemId),
        isNull(assignmentProblem.deletedAt),
        isNull(problems.deletedAt),
      ),
    )
    .limit(1)

  return rows[0] ?? null
}

/** The current user's solution for a problem (via their submission), if any. */
export async function fetchUserProblemSolution(
  userId: number,
  assignmentId: number,
  problemId: number,
): Promise<ProblemSolutionRow | null> {
  const rows = await db
    .select({
      id: solutions.id,
      submissionLink: solutions.submissionLink,
      status: solutions.status,
      submittedAt: solutions.submittedAt,
    })
    .from(solutions)
    .innerJoin(submissions, eq(solutions.submissionId, submissions.id))
    .where(
      and(
        eq(solutions.problemId, problemId),
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.userId, userId),
        isNull(solutions.deletedAt),
        isNull(submissions.deletedAt),
      ),
    )
    .orderBy(desc(solutions.id))
    .limit(1)

  return rows[0] ?? null
}
