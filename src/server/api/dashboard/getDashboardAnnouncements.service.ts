import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

export interface DashboardAnnouncementItem {
  id: number
  title: string
  authorName: string | null
  /** true = sourced from messages table (personal); false = batch-level announcement */
  isForYou: boolean
}

export interface GetDashboardAnnouncementsResponse {
  announcements: Array<DashboardAnnouncementItem>
}

type RawRow = {
  id: number | string | bigint
  title: string
  authorName: string | null
}

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

function toItem(row: RawRow, isForYou: boolean): DashboardAnnouncementItem {
  return {
    id: Number(row.id),
    title: String(row.title),
    authorName: row.authorName ? String(row.authorName) : null,
    isForYou,
  }
}

/**
 * Fetches active announcements for the given user.
 *
 * "Active" = current server time falls between `schedule` and `concludes`.
 *
 * Sources:
 *  - announcements table  → batch-level  → isForYou: false
 *  - messages table       → user-level   → isForYou: true  (shown first)
 */
export async function getDashboardAnnouncements(
  userId: number,
): Promise<Array<DashboardAnnouncementItem>> {
  // ── Batch-level announcements ──────────────────────────────────────────────
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  let announcementItems: Array<DashboardAnnouncementItem> = []

  if (batchIds.length > 0) {
    // batchIds come from our own DB query (numbers), safe to inline
    const batchIdList = batchIds.map(Number).filter(Number.isFinite).join(', ')

    const announcementResult = await db.execute(sql`
      SELECT
        a.id,
        a.subject  AS title,
        u.name     AS authorName
      FROM announcements a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.batch_id IN (${sql.raw(batchIdList)})
        AND a.schedule  <= NOW()
        AND a.concludes >= NOW()
        AND a.deleted_at IS NULL
      ORDER BY a.created_at DESC
      LIMIT 20
    `)

    announcementItems = normalizeRows(announcementResult).map((row) =>
      toItem(row, false),
    )
  }

  // ── User-level messages ────────────────────────────────────────────────────
  const messageResult = await db.execute(sql`
    SELECT
      m.id,
      m.subject  AS title,
      u.name     AS authorName
    FROM messages m
    LEFT JOIN users u ON u.id = m.author_id
    WHERE m.user_id     = ${userId}
      AND m.schedule   <= NOW()
      AND m.concludes  >= NOW()
      AND m.deleted_at  IS NULL
    ORDER BY m.created_at DESC
    LIMIT 20
  `)

  const messageItems = normalizeRows(messageResult).map((row) =>
    toItem(row, true),
  )

  // Messages (isForYou) come first so they appear at the top
  return [...messageItems, ...announcementItems]
}
