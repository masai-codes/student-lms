import { sql } from 'drizzle-orm'
import { db } from '@/db'

const SUPPORT_SECTION_ID = 7576

export interface LmsSupportInfo {
  /** false → no rows in the 8-day window → hide widget */
  visible: boolean
  /** schedule of today's lecture (IST naive string), null if none today */
  todaySchedule: string | null
  /** concludes of today's lecture (IST naive string), null if none today */
  todayConcludes: string | null
  /** zoom link of today's lecture */
  todayZoomLink: string | null
  /** next upcoming lecture schedule when no lecture today */
  nextSchedule: string | null
}

type RawRow = Record<string, unknown>

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

const NOT_VISIBLE: LmsSupportInfo = {
  visible: false,
  todaySchedule: null,
  todayConcludes: null,
  todayZoomLink: null,
  nextSchedule: null,
}

/**
 * Returns LMS support widget data.
 * Not user-scoped — section 7576 is the dedicated support section visible to all Masai students.
 *
 * States (resolved in frontend from returned data):
 *   Live            → todaySchedule set AND now between schedule and concludes
 *   Scheduled Today → todaySchedule set AND schedule still in future
 *   Next Session    → todaySchedule null, nextSchedule set
 *   Hidden          → visible = false (no rows in 8-day window)
 */
export async function getLmsSupportInfo(): Promise<LmsSupportInfo> {
  const nowIST = normalizeRows(
    await db.execute(sql`SELECT CONVERT_TZ(NOW(), '+00:00', '+05:30') AS nowIST`)
  )[0]?.nowIST as string | undefined

  const todayDateIST = nowIST ? nowIST.slice(0, 10) : new Date().toISOString().slice(0, 10)

  // All non-deleted lectures in the next 8 days
  const allRows = normalizeRows(
    await db.execute(sql`
      SELECT id, schedule, concludes, zoom_link AS zoomLink
      FROM lectures
      WHERE section_id = ${SUPPORT_SECTION_ID}
        AND schedule   >= CURDATE()
        AND schedule   <= DATE_ADD(CURDATE(), INTERVAL 8 DAY)
        AND deleted_at IS NULL
      ORDER BY schedule ASC
    `)
  )

  if (allRows.length === 0) return NOT_VISIBLE

  // A lecture is "active" only if it has a zoom_link; no zoom_link = cancelled
  const isActive = (r: RawRow) => r.zoomLink && String(r.zoomLink).trim() !== ''

  const todayRow = allRows.find((r) => String(r.schedule ?? '').slice(0, 10) === todayDateIST)

  if (todayRow) {
    const sessionOver = nowIST && todayRow.concludes
      ? nowIST > String(todayRow.concludes)
      : false

    if (isActive(todayRow) && !sessionOver) {
      return {
        visible: true,
        todaySchedule: todayRow.schedule ? String(todayRow.schedule) : null,
        todayConcludes: todayRow.concludes ? String(todayRow.concludes) : null,
        todayZoomLink: String(todayRow.zoomLink),
        nextSchedule: null,
      }
    }

    // Today's session is over or has no zoom_link — show next upcoming active session
    const nextActiveRow = allRows.find((r) =>
      String(r.schedule ?? '').slice(0, 10) !== todayDateIST && isActive(r)
    )
    if (!nextActiveRow) return NOT_VISIBLE
    return {
      visible: true,
      todaySchedule: null,
      todayConcludes: null,
      todayZoomLink: null,
      nextSchedule: String(nextActiveRow.schedule),
    }
  }

  // No lecture today — show next active upcoming
  const nextActiveRow = allRows.find((r) => isActive(r))
  if (nextActiveRow) {
    return {
      visible: true,
      todaySchedule: null,
      todayConcludes: null,
      todayZoomLink: null,
      nextSchedule: String(nextActiveRow.schedule),
    }
  }

  return NOT_VISIBLE
}
