import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'

export type NavbarPillEventType = 'evaluation' | 'live' | 'scrum'

export interface NavbarPillEvent {
  id: number
  title: string
  schedule: string
  concludes: string
  eventType: NavbarPillEventType
  /** Only present for lectures */
  zoomLink: string | null
}

type RawRow = Record<string, unknown>

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as Record<string, unknown>)['rows'])) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

const PRIORITY: Record<NavbarPillEventType, number> = {
  evaluation: 1,
  live: 2,
  scrum: 3,
}

/**
 * Returns the single highest-priority upcoming/live event for the navbar pill.
 *
 * Selection:
 * - Evaluation assignments (priority 1) > live lectures (2) > scrum lectures (3)
 * - Visible window: schedule - 5min ≤ now < concludes
 * - Events longer than 24h are excluded
 * - Tiebreaker: not-yet-started first, then soonest schedule
 */
export async function getNavbarPillEvent(userId: number): Promise<NavbarPillEvent | null> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return null

  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return null

  const batchIdList = batchIds.map(Number).filter(Number.isFinite).join(', ')
  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')

  // Query 1: live/scrum lectures
  const lectureRows = normalizeRows(
    await db.execute(sql`
      SELECT id, title, schedule, concludes, zoom_link AS zoomLink, type
      FROM lectures
      WHERE type IN ('live', 'scrum')
        AND section_id IN (${sql.raw(sectionIdList)})
        AND batch_id IN (${sql.raw(batchIdList)})
        AND (
          concludes >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          OR schedule BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        )
        AND schedule IS NOT NULL
        AND concludes IS NOT NULL
        AND deleted_at IS NULL
    `)
  )

  // Query 2: evaluation assignments
  const assignmentRows = normalizeRows(
    await db.execute(sql`
      SELECT id, title, schedule, concludes, NULL AS zoomLink, 'evaluation' AS type
      FROM assignments
      WHERE type = 'evaluation'
        AND section_id IN (${sql.raw(sectionIdList)})
        AND batch_id IN (${sql.raw(batchIdList)})
        AND (
          concludes >= DATE_SUB(NOW(), INTERVAL 1 DAY)
          OR schedule BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        )
        AND schedule IS NOT NULL
        AND concludes IS NOT NULL
        AND deleted_at IS NULL
    `)
  )

  const now = Date.now()
  const FIVE_MINS = 5 * 60 * 1000
  const ONE_DAY = 24 * 60 * 60 * 1000

  const allEvents: Array<NavbarPillEvent & { startMs: number; priority: number }> = []

  for (const row of [...lectureRows, ...assignmentRows]) {
    const schedule = row.schedule ? String(row.schedule) : null
    const concludes = row.concludes ? String(row.concludes) : null
    if (!schedule || !concludes) continue

    const startMs = new Date(schedule.includes('T') ? schedule : schedule.replace(' ', 'T') + '+05:30').getTime()
    const endMs = new Date(concludes.includes('T') ? concludes : concludes.replace(' ', 'T') + '+05:30').getTime()

    // Exclude events longer than 24h
    if (endMs - startMs > ONE_DAY) continue

    // Visible window: within 5 min of start and not yet ended
    if (now < startMs - FIVE_MINS) continue
    if (now >= endMs) continue

    const type = String(row.type ?? '') as NavbarPillEventType
    const priority = PRIORITY[type]

    allEvents.push({
      id: Number(row.id),
      title: String(row.title ?? ''),
      schedule,
      concludes,
      eventType: type,
      zoomLink: row.zoomLink ? String(row.zoomLink) : null,
      startMs,
      priority,
    })
  }

  if (allEvents.length === 0) return null

  // Sort: priority asc, then not-yet-started first, then soonest start
  allEvents.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const aStarted = now >= a.startMs ? 1 : 0
    const bStarted = now >= b.startMs ? 1 : 0
    if (aStarted !== bStarted) return aStarted - bStarted
    return a.startMs - b.startMs
  })

  const { priority: _p, startMs: _s, ...event } = allEvents[0]
  return event
}
