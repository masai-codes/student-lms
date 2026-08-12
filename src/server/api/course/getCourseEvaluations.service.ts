import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import { parseIstToMs } from '@/server/time/istClock'

type EvaluationStatus =
  | 'UPCOMING'
  | 'COMPLETED'
  | 'SCORE_PENDING'
  | 'NOT_ATTEMPTED'

export interface CourseEvaluationItem {
  label: string
  scheduleDisplay: string
  durationMinutes: number
  description: string
  status: EvaluationStatus
  score: number | null
}

function normalizeRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as T[]
    return result as T[]
  }
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows
  }
  return []
}

function formatScheduleDisplay(schedule: string): string {
  try {
    const ms = parseIstToMs(schedule)
    if (ms == null) return schedule
    const d = new Date(ms)
    // Read the wall-clock parts in IST so display is correct on any server tz.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d)
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? ''
    return `${get('day')} ${get('month')} at ${get('hour')}.${get('minute')} ${get('dayPeriod').toUpperCase()}`
  } catch {
    return schedule
  }
}

async function resolveEvaluationStatus(
  assignmentIds: number[],
  userId: number,
  now: number,
): Promise<{ status: EvaluationStatus; score: number | null }> {
  if (assignmentIds.length === 0) return { status: 'UPCOMING', score: null }

  const idList = assignmentIds.join(', ')

  // Fetch assignments to check schedule/concludes
  type AssignmentRow = {
    id: number | string
    schedule: string | null
    concludes: string | null
  }
  const assignmentRows = normalizeRows<AssignmentRow>(
    await db.execute(sql`
      SELECT id, schedule, concludes
      FROM assignments
      WHERE id IN (${sql.raw(idList)})
        AND deleted_at IS NULL
      LIMIT 1
    `),
  )

  const assignment = assignmentRows[0]
  if (!assignment) return { status: 'UPCOMING', score: null }

  const scheduleTs = parseIstToMs(assignment.schedule)
  const concludesTs = parseIstToMs(assignment.concludes)

  if (scheduleTs && now < scheduleTs) {
    return { status: 'UPCOMING', score: null }
  }

  // Check submissions
  type SubmissionRow = {
    id: number | string
    score: number | string | null
    completed: number | string
    data: unknown
  }
  const submissionRows = normalizeRows<SubmissionRow>(
    await db.execute(sql`
      SELECT id, score, completed, data
      FROM submissions
      WHERE user_id = ${userId}
        AND assignment_id IN (${sql.raw(idList)})
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `),
  )

  const submission = submissionRows[0]

  if (!submission) {
    if (concludesTs && now > concludesTs)
      return { status: 'NOT_ATTEMPTED', score: null }
    return { status: 'UPCOMING', score: null }
  }

  const data = (
    typeof submission.data === 'object' && submission.data !== null
      ? submission.data
      : {}
  ) as Record<string, unknown>

  if (data.updatedScore !== undefined || data.scoreUpdatedByAdmin) {
    return {
      status: 'COMPLETED',
      score: submission.score != null ? Number(submission.score) : null,
    }
  }

  if (Number(submission.completed) === 1) {
    return { status: 'SCORE_PENDING', score: null }
  }

  if (concludesTs && now > concludesTs) {
    return { status: 'NOT_ATTEMPTED', score: null }
  }

  return { status: 'UPCOMING', score: null }
}

export async function getCourseEvaluations(
  batchId: number,
  userId: number,
): Promise<CourseEvaluationItem[]> {
  const [batchRow] = await db
    .select({ settings: batches.settings })
    .from(batches)
    .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
    .limit(1)

  const settings = (batchRow?.settings ?? {}) as Record<string, unknown>
  const evaluationDetails = Array.isArray(settings.evaluationDetails)
    ? (settings.evaluationDetails as Array<Record<string, unknown>>)
    : []

  if (evaluationDetails.length === 0) return []

  const now = Date.now()

  return Promise.all(
    evaluationDetails.map(async (ev): Promise<CourseEvaluationItem> => {
      const label = typeof ev.title === 'string' ? ev.title : 'Evaluation'
      const schedule =
        typeof ev.schedule === 'string'
          ? ev.schedule
          : typeof ev.date === 'string'
            ? ev.date
            : ''
      const duration = Number(
        ev.durationMins ?? ev.durationMinutes ?? ev.duration ?? 0,
      )
      const description =
        typeof ev.rules === 'string'
          ? ev.rules
          : typeof ev.description === 'string'
            ? ev.description
            : ''

      const assignmentIds: number[] = Array.isArray(ev.evaluations)
        ? (ev.evaluations as unknown[]).map(Number).filter(Number.isFinite)
        : []

      const { status, score } = await resolveEvaluationStatus(
        assignmentIds,
        userId,
        now,
      )

      return {
        label,
        scheduleDisplay: schedule ? formatScheduleDisplay(schedule) : '',
        durationMinutes: duration,
        description,
        status,
        score,
      }
    }),
  )
}
