import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { announcements, sectionUser } from '@/db/schema'
import { getAnnouncementBookmarkState } from './announcementBookmark.service'

export interface AnnouncementDetail {
  id: string
  source: 'a' | 'm'
  title: string
  body: string
  authorName: string
  /** Raw timestamp — formatted client-side so local TZ is shown with IST tooltip. */
  scheduledAt: string
  category: string
  tags: string | null
  isForYou: boolean
  /** false means mark-as-unread is skipped for this announcement */
  trackRead: boolean
  isBookmarked: boolean
  bookmarkId: number | null
  /** e.g. "critical", "general" for announcements; from meta.message_type for messages */
  type: string | null
  ctaName: string | null
  ctaLink: string | null
  /** For messages: sender name from meta.from */
  from: string | null
  /** true when the item was already read before opening (no badge decrement needed) */
  isRead: boolean
  /** For messages: all thread messages ordered by createdAt */
  thread: Array<{
    id: string
    body: string
    scheduledAt: string
    isSentByUser: boolean
  }>
}

type RawRow = {
  id: number | string | bigint
  subject: string
  body: string
  category: string | null
  tags: string | null
  type: string | null
  schedule: string | null
  createdAt: string | null
  authorName: string | null
  trackRead?: number | string | null
  ctaName: string | null
  ctaLink: string | null
  from: string | null
  metaTitle: string | null
  authorId: number | string | null
  isRead: number | string | null
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

// ── Announcement detail ────────────────────────────────────────────────────────

async function getAnnouncementDetail(
  userId: number,
  announcementId: number,
): Promise<AnnouncementDetail | null> {
  const result = await db.execute(sql`
    SELECT
      a.id,
      a.subject,
      a.body,
      a.category,
      a.tags,
      a.type,
      a.schedule,
      a.created_at  AS createdAt,
      u.name        AS authorName,
      a.track_read  AS trackRead,
      a.cta_name    AS ctaName,
      a.cta_link    AS ctaLink,
      CASE WHEN ar.id IS NOT NULL AND ar.is_unread = 0 THEN 1 ELSE 0 END AS isRead
    FROM announcements a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ${userId}
    WHERE a.id = ${announcementId}
      AND a.deleted_at IS NULL
    LIMIT 1
  `)

  const row = normalizeRows(result)[0]
  if (!row) return null

  // Access check: user must be enrolled in the announcement's section
  const ann = await db
    .select({ sectionId: announcements.sectionId })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1)

  const sectionId = ann[0]?.sectionId
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

  const { isBookmarked, bookmarkId } = await getAnnouncementBookmarkState(
    userId,
    announcementId,
  )

  return {
    id: String(announcementId),
    source: 'a' as const,
    title: String(row.subject),
    body: String(row.body),
    authorName: row.authorName ? String(row.authorName) : '',
    scheduledAt: row.schedule ?? row.createdAt ?? '',
    category: row.category ? String(row.category) : '',
    tags: row.tags ? String(row.tags) : null,
    type: row.type ? String(row.type) : null,
    isForYou: false,
    trackRead: Number(row.trackRead) === 1,
    isRead: Number(row.isRead) === 1,
    isBookmarked,
    bookmarkId,
    ctaName: row.ctaName ? String(row.ctaName) : null,
    ctaLink: row.ctaLink ? String(row.ctaLink) : null,
    from: null,
    thread: [],
  }
}

// ── Message detail ─────────────────────────────────────────────────────────────

async function getMessageDetail(
  userId: number,
  messageId: number,
): Promise<AnnouncementDetail | null> {
  const result = await db.execute(sql`
    SELECT
      m.id,
      m.subject,
      m.body,
      m.schedule,
      m.created_at AS createdAt,
      m.read_at    AS isRead,
      u.name       AS authorName,
      JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type,
      JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.category'))     AS category,
      JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title'))        AS metaTitle,
      JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.from'))         AS \`from\`,
      m.cta_name                                           AS ctaName,
      m.cta_link                                           AS ctaLink,
      m.author_id                                          AS authorId
    FROM messages m
    LEFT JOIN users u ON u.id = m.author_id
    WHERE (m.id = ${messageId} OR m.message_id = ${messageId})
      AND m.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM messages root
        WHERE root.id = ${messageId}
          AND root.user_id = ${userId}
          AND root.deleted_at IS NULL
      )
    ORDER BY m.created_at ASC
  `)

  const rows = normalizeRows(result)
  if (rows.length === 0) return null

  // Root row — the one whose id matches (not a reply)
  const root = rows.find((r) => String(r.id) === String(messageId)) ?? rows[0]

  const { isBookmarked, bookmarkId } = await getAnnouncementBookmarkState(
    userId,
    messageId,
  )

  return {
    id: String(messageId),
    source: 'm' as const,
    title: root.metaTitle ? String(root.metaTitle) : String(root.subject),
    body: String(root.body),
    authorName: root.authorName ? String(root.authorName) : '',
    scheduledAt: root.schedule ?? root.createdAt ?? '',
    category: root.category ? String(root.category) : '',
    tags: null,
    type: root.type ? String(root.type) : null,
    isForYou: true,
    trackRead: true,
    isRead: root.isRead != null,
    isBookmarked,
    bookmarkId,
    ctaName: root.ctaName ? String(root.ctaName) : null,
    ctaLink: root.ctaLink ? String(root.ctaLink) : null,
    from: root.from ? String(root.from) : null,
    thread: rows.map((r) => ({
      id: String(r.id),
      body: String(r.body),
      scheduledAt: r.schedule ?? r.createdAt ?? '',
      isSentByUser: Number(r.authorId) === userId,
    })),
  }
}

// ── Public entry point ─────────────────────────────────────────────────────────

export async function getAnnouncementById(
  userId: number,
  numericId: number,
  source: 'a' | 'm',
): Promise<AnnouncementDetail | null> {
  if (source === 'm') return getMessageDetail(userId, numericId)
  return getAnnouncementDetail(userId, numericId)
}
