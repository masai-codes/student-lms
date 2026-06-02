import { and, count, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { lectures, sectionUser } from '@/db/schema'

const SUPPORT_SECTION_ID = 5996

export interface LmsSupportInfo {
  /** false → user is not in section 5996, or no lectures exist → hide card */
  visible: boolean
  /** schedule datetime of today's active lecture (IST naive string) */
  todaySchedule: string | null
  /** concludes datetime of today's active lecture (IST naive string) */
  todayConcludes: string | null
  /** zoom link of today's active lecture */
  todayZoomLink: string | null
  /** today had a scheduled lecture but it was soft-deleted (cancelled) */
  isCancelledToday: boolean
  /** next upcoming lecture schedule, shown in cancelled state */
  nextSchedule: string | null
}

type RawLectureRow = Record<string, unknown>

function normalizeRows(result: unknown): Array<RawLectureRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawLectureRow>
    return result as Array<RawLectureRow>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray(result.rows)) {
    return (result as { rows: Array<RawLectureRow> }).rows
  }
  return []
}

const NOT_VISIBLE: LmsSupportInfo = {
  visible: false,
  todaySchedule: null,
  todayConcludes: null,
  todayZoomLink: null,
  isCancelledToday: false,
  nextSchedule: null,
}

/**
 * Returns LMS support card data for the dashboard sidebar.
 *
 * Visibility gate:
 *   - User must be an active member of section 5996 (section_user, deleted_at IS NULL)
 *   - At least one non-deleted lecture must exist for section 5996
 *
 * State logic (evaluated in order):
 *   1. Today has an active lecture  → visible + todaySchedule/concludes/zoomLink set
 *   2. Today's lecture was cancelled (deleted_at IS NOT NULL) → isCancelledToday + nextSchedule
 *   3. No lecture today at all      → visible + all nulls (generic state)
 */
export async function getLmsSupportInfo(userId: number): Promise<LmsSupportInfo> {
  // ── 1. Section membership check ───────────────────────────────────────────
  const membership = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, SUPPORT_SECTION_ID),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  if (membership.length === 0) return NOT_VISIBLE

  // ── 2. At least one non-deleted lecture must exist ─────────────────────────
  const [countRow] = await db
    .select({ total: count() })
    .from(lectures)
    .where(and(eq(lectures.sectionId, SUPPORT_SECTION_ID), isNull(lectures.deletedAt)))

  if (!countRow || countRow.total === 0) return NOT_VISIBLE

  const todayIST = sql`DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))`

  // ── 3. Today's active (non-deleted) lecture ────────────────────────────────
  const activeResult = await db.execute(sql`
    SELECT schedule, concludes, zoom_link AS zoomLink
    FROM lectures
    WHERE section_id  = ${SUPPORT_SECTION_ID}
      AND deleted_at  IS NULL
      AND DATE(schedule) = ${todayIST}
    ORDER BY schedule ASC
    LIMIT 1
  `)

  const activeRow = normalizeRows(activeResult)[0]

  if (activeRow) {
    return {
      visible: true,
      todaySchedule: activeRow.schedule ? String(activeRow.schedule) : null,
      todayConcludes: activeRow.concludes ? String(activeRow.concludes) : null,
      todayZoomLink: activeRow.zoomLink ? String(activeRow.zoomLink) : null,
      isCancelledToday: false,
      nextSchedule: null,
    }
  }

  // ── 4. Was today's lecture cancelled (soft-deleted)? ──────────────────────
  const cancelledResult = await db.execute(sql`
    SELECT id
    FROM lectures
    WHERE section_id  = ${SUPPORT_SECTION_ID}
      AND deleted_at  IS NOT NULL
      AND DATE(schedule) = ${todayIST}
    LIMIT 1
  `)

  const cancelledRow = normalizeRows(cancelledResult)[0]

  if (cancelledRow) {
    // Get the next upcoming non-deleted lecture
    const nextResult = await db.execute(sql`
      SELECT schedule
      FROM lectures
      WHERE section_id = ${SUPPORT_SECTION_ID}
        AND deleted_at IS NULL
        AND schedule   > CONVERT_TZ(NOW(), '+00:00', '+05:30')
      ORDER BY schedule ASC
      LIMIT 1
    `)

    const nextRow = normalizeRows(nextResult)[0]

    return {
      visible: true,
      todaySchedule: null,
      todayConcludes: null,
      todayZoomLink: null,
      isCancelledToday: true,
      nextSchedule: nextRow?.schedule ? String(nextRow.schedule) : null,
    }
  }

  // ── 5. No lecture today → generic state ───────────────────────────────────
  return {
    visible: true,
    todaySchedule: null,
    todayConcludes: null,
    todayZoomLink: null,
    isCancelledToday: false,
    nextSchedule: null,
  }
}
