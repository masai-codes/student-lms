import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'

export interface DashboardAnnouncementItem {
  id: number
  title: string
  authorName: string | null
  /** true = sourced from messages table (personal / For You) */
  isForYou: boolean
}

export interface GetDashboardAnnouncementsResponse {
  announcements: Array<DashboardAnnouncementItem>
}

type RawRow = {
  id: number | string | bigint
  title: string
  authorName: string | null
  isForYou: number | string
  sortedAt: string | null
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

/**
 * Fetches the 2 most recent unread, currently active announcements/messages
 * for the user's enrolled sections.
 *
 * Announcements (batch-level, isForYou = false):
 *   - section_id is in the user's active sections
 *   - deleted_at IS NULL
 *   - schedule   <= NOW (IST)        → already released
 *   - concludes IS NULL OR concludes >= NOW (IST)  → not yet expired
 *   - Unread: track_read = true AND (no announcement_reads row for this user
 *             OR announcement_reads.is_unread = true)
 *
 * Messages (personal, isForYou = true):
 *   - user_id = this user
 *   - deleted_at IS NULL
 *   - Same date window
 *   - read_at IS NULL
 *
 * Both are unioned, sorted by schedule DESC (created_at DESC as tie-break),
 * and capped at 2.
 */
export async function getDashboardAnnouncements(
  userId: number,
): Promise<Array<DashboardAnnouncementItem>> {
  // Resolve section IDs via the portal allowlist
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return []

  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return []

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')

  const result = await db.execute(sql`
    SELECT id, title, authorName, isForYou, sortedAt FROM (

      -- ── Announcements (section-scoped, unread) ──────────────────────────────
      SELECT
        a.id,
        a.subject                    AS title,
        u.name                       AS authorName,
        0                            AS isForYou,
        COALESCE(a.schedule, a.created_at) AS sortedAt
      FROM announcements a
      LEFT JOIN users u              ON u.id = a.user_id
      LEFT JOIN announcement_reads ar
             ON ar.announcement_id  = a.id
            AND ar.user_id          = ${userId}
      WHERE a.section_id IN (${sql.raw(sectionIdList)})
        AND a.deleted_at IS NULL
        AND a.schedule  <= CONVERT_TZ(NOW(), '+00:00', '+05:30')
        AND (a.concludes IS NULL OR a.concludes >= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
        AND a.track_read = 1
        AND (ar.id IS NULL OR ar.is_unread = 1)

      UNION ALL

      -- ── Messages (personal, unread) ─────────────────────────────────────────
      SELECT
        m.id,
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS title,
        u.name                       AS authorName,
        1                            AS isForYou,
        COALESCE(m.schedule, m.created_at) AS sortedAt
      FROM messages m
      LEFT JOIN users u              ON u.id = m.author_id
      WHERE m.user_id    = ${userId}
        AND m.deleted_at IS NULL
        AND m.schedule  <= CONVERT_TZ(NOW(), '+00:00', '+05:30')
        AND m.concludes >= CONVERT_TZ(NOW(), '+00:00', '+05:30')
        AND m.read_at    IS NULL

    ) combined
    ORDER BY sortedAt DESC
    LIMIT 2
  `)

  return normalizeRows(result).map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    authorName: row.authorName ? String(row.authorName) : null,
    isForYou: Number(row.isForYou) === 1,
  }))
}
