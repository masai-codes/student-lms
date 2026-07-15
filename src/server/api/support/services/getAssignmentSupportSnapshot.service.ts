import { and, desc, eq, isNull } from 'drizzle-orm'

import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'
import type { AssignmentSupportSnapshot } from '@/server/api/support/support.types'
import { db } from '@/db'
import { assignments, submissions } from '@/db/schema'
import { fetchAssignmentProblemRows } from '@/server/learn/queries/fetchAssignmentProblems'
import { buildAssignmentDetailFooter } from '@/server/learn/utils/buildAssignmentDetailFooter'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'
import { resolveAssignmentSupportSnapshot } from '@/server/learn/utils/resolveAssignmentSupportSnapshot'

function normalizeAssignmentKind(type: string): AssignmentKind | null {
  const normalized = type.trim().toLowerCase()
  if (
    normalized === 'practice' ||
    normalized === 'assignment' ||
    normalized === 'evaluation'
  ) {
    return normalized
  }
  return null
}

export async function getAssignmentSupportSnapshot(
  userId: number,
  assignmentId: number,
): Promise<AssignmentSupportSnapshot> {
  const rows = await db
    .select({
      id: assignments.id,
      type: assignments.type,
      category: assignments.category,
      platform: assignments.platform,
      showScores: assignments.showScores,
      showSubmission: assignments.showSubmission,
      settings: assignments.settings,
      schedule: assignments.schedule,
      concludes: assignments.concludes,
      batchId: assignments.batchId,
      sectionId: assignments.sectionId,
    })
    .from(assignments)
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const row = rows[0]
  const assignmentKind = normalizeAssignmentKind(row.type)
  if (assignmentKind == null) {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    row.batchId,
    row.sectionId,
  )
  if (!allowed) {
    throw new Error('SUPPORT_ASSIGNMENT_NOT_FOUND')
  }

  const nowMs = Date.now()

  const [submissionRows, problemRows] = await Promise.all([
    db
      .select({
        id: submissions.id,
        completed: submissions.completed,
        status: submissions.status,
        markAsCompleted: submissions.markAsCompleted,
        score: submissions.score,
        startedAt: submissions.startedAt,
        completedAt: submissions.completedAt,
        data: submissions.data,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.userId, userId),
          isNull(submissions.deletedAt),
        ),
      )
      .orderBy(desc(submissions.createdAt))
      .limit(1),
    fetchAssignmentProblemRows(assignmentId),
  ])

  const submissionRow = submissionRows[0] ?? null
  const submission =
    submissionRow == null
      ? null
      : {
          id: submissionRow.id,
          completed: submissionRow.completed === 1,
          status: submissionRow.status,
          markAsCompleted:
            submissionRow.markAsCompleted == null
              ? null
              : submissionRow.markAsCompleted === 1,
          score: submissionRow.score,
          startedAt: submissionRow.startedAt,
          completedAt: submissionRow.completedAt,
          data: submissionRow.data ?? null,
        }

  const progressStatus = calculateAssignmentProgressStatus({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
    submission,
  })

  const phase = resolveAssignmentPhase({
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
  })

  const footer = buildAssignmentDetailFooter({
    assignmentKind,
    category: row.category,
    platform: row.platform,
    showScores: row.showScores === 1,
    showSubmission: row.showSubmission === 1,
    settings: row.settings,
    schedule: row.schedule,
    concludes: row.concludes,
    nowMs,
    problemCount: problemRows.length,
    submission,
  })

  return resolveAssignmentSupportSnapshot({
    assignmentId,
    assignmentKind,
    phase,
    progressStatus,
    footer,
  })
}
