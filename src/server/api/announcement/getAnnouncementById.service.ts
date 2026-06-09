import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
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
      a.track_read  AS trackRead
    FROM announcements a
    LEFT JOIN users u ON u.id = a.user_id
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

  const { isBookmarked, bookmarkId } = await getAnnouncementBookmarkState(userId, announcementId)

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
    isBookmarked,
    bookmarkId,
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
      u.name       AS authorName,
      JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type
    FROM messages m
    LEFT JOIN users u ON u.id = m.author_id
    WHERE m.id = ${messageId}
      AND m.user_id = ${userId}
      AND m.deleted_at IS NULL
    LIMIT 1
  `)

  const row = normalizeRows(result)[0]
  if (!row) return null

  const { isBookmarked, bookmarkId } = await getAnnouncementBookmarkState(userId, messageId)

  return {
    id: String(messageId),
    source: 'm' as const,
    title: String(row.subject),
    body: String(row.body),
    authorName: row.authorName ? String(row.authorName) : '',
    scheduledAt: row.schedule ?? row.createdAt ?? '',
    category: '',
    tags: null,
    type: row.type ? String(row.type) : null,
    isForYou: true,
    trackRead: true,
    isBookmarked,
    bookmarkId,
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
