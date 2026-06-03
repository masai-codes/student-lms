import { sql } from 'drizzle-orm'
import { db } from '@/db'

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/**
 * Calculates average assignment score (out of 10) for a user in a batch.
 *
 * Steps:
 * 1. Find valid assignments: non-optional, non-deleted, in the user's enrolled sections.
 * 2. AVG(submissions.score) for completed, non-deleted submissions against those assignments.
 *
 * Returns null if no completed submissions exist yet.
 */
export async function getDashboardAssignmentScore(
  userId: number,
  batchId: number,
  sectionIds: Array<number>,
): Promise<number | null> {
  if (sectionIds.length === 0) return null

  const sectionIdList = sectionIds.join(', ')

  const assignmentRows = normalizeRows<{ id: number | string }>(
    await db.execute(sql`
      SELECT a.id
      FROM assignments a
      WHERE a.batch_id   = ${batchId}
        AND a.section_id IN (${sql.raw(sectionIdList)})
        AND a.optional   = 0
        AND a.deleted_at IS NULL
    `)
  )

  const assignmentIds = assignmentRows.map((r) => Number(r.id)).filter(Number.isFinite)
  if (assignmentIds.length === 0) return null

  const assignmentIdList = assignmentIds.join(', ')

  const scoreRows = normalizeRows<{ avgScore: number | string | null }>(
    await db.execute(sql`
      SELECT AVG(s.score) AS avgScore
      FROM submissions s
      WHERE s.user_id       = ${userId}
        AND s.assignment_id IN (${sql.raw(assignmentIdList)})
        AND s.deleted_at    IS NULL
        AND s.completed     = 1
    `)
  )

  const raw = scoreRows[0]?.avgScore
  if (raw === null || raw === undefined) return null

  return Math.round(Number(raw) * 100) / 100
}
