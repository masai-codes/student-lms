import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { announcements, sectionUser } from '@/db/schema'

export interface AnnouncementDetail {
  id: string
  title: string
  body: string
  authorName: string
  scheduledAt: string
  category: string
  tags: string | null
}

type RawRow = {
  id: number | string | bigint
  subject: string
  body: string
  category: string
  tags: string | null
  schedule: string | null
  createdAt: string | null
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

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
  return `${datePart}, ${timePart} (IST)`
}

/**
 * Fetches a single announcement by ID.
 *
 * Access check: the announcement's section_id must be one the user is enrolled in
 * via section_user (deleted_at IS NULL). Returns null if not found or not accessible.
 */
export async function getAnnouncementById(
  userId: number,
  announcementId: number,
): Promise<AnnouncementDetail | null> {
  // ── Fetch the announcement ─────────────────────────────────────────────────
  const result = await db.execute(sql`
    SELECT
      a.id,
      a.subject,
      a.body,
      a.category,
      a.tags,
      a.schedule,
      a.created_at AS createdAt,
      u.name       AS authorName
    FROM announcements a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.id = ${announcementId}
      AND a.deleted_at IS NULL
    LIMIT 1
  `)

  const rows = normalizeRows(result)
  const row = rows[0]
  if (!row) return null

  // ── Access check: user must be enrolled in the announcement's section ──────
  const announcement = await db
    .select({ sectionId: announcements.sectionId })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1)

  const sectionId = announcement[0]?.sectionId
  if (sectionId == null) return null

  const membership = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sectionUser.sectionId, sectionId),
        isNull(sectionUser.deletedAt),
      ),
    )
    .limit(1)

  if (membership.length === 0) return null

  return {
    id: String(row.id),
    title: String(row.subject),
    body: String(row.body),
    authorName: row.authorName ? String(row.authorName) : '',
    scheduledAt: formatDateTime(row.schedule ?? row.createdAt),
    category: String(row.category),
    tags: row.tags ? String(row.tags) : null,
  }
}
