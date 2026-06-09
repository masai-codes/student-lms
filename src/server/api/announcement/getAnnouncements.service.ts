import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { sectionUser } from '@/db/schema'
import type { AnnouncementsQueryParams } from './utils/parseAnnouncementsQuery'

export interface AnnouncementItem {
  id: string
  /** 'a' = announcements table, 'm' = messages table. Used by the detail handler. */
  source: 'a' | 'm'
  title: string
  authorName: string
  /** Raw ISO timestamp — formatted client-side so local TZ is applied. */
  createdAt: string
  isForYou: boolean
  /** Announcement type from the announcements table (e.g. "critical"). Null for messages. */
  type: string | null
  /**
   * Whether the red unread dot should be shown.
   * Announcements: driven by track_read + announcement_reads join.
   * Messages: read_at IS NULL.
   */
  isUnread: boolean
}

export interface GetAnnouncementsResult {
  announcements: Array<AnnouncementItem>
  total: number
}

type RawRow = {
  source: string
  id: number | string | bigint
  subject: string
  authorName: string | null
  createdAt: string | null
  isForYou: number | string
  type: string | null
  isUnread: number | string
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

function normalizeCount(result: unknown): number {
  let rows: Array<Record<string, unknown>> = []
  if (Array.isArray(result)) {
    const first = result[0]
    rows = Array.isArray(first)
      ? (first as Array<Record<string, unknown>>)
      : (result as Array<Record<string, unknown>>)
  } else if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    rows = (result as { rows: Array<Record<string, unknown>> }).rows
  }
  const raw = rows[0]?.['total']
  return raw != null ? Number(raw) : 0
}

/**
 * Fetches a paginated, optionally-searched page of announcements + personal
 * messages for the user.
 *
 * Both sources are blended in a single UNION ALL:
 *   • announcements — section-scoped, schedule <= NOW IST, not deleted
 *   • messages      — user-scoped (user_id = userId), top-level only
 *                     (message_id IS NULL), schedule <= NOW IST, not deleted
 *
 * IDs are prefixed with "a-" (announcements) or "m-" (messages) so the detail
 * handler knows which table to query.
 *
 * isUnread logic:
 *   Announcements: track_read must be 1; then no ar row → unread, ar.is_unread=1 → unread,
 *                  popup seen but not read → unread, otherwise read.
 *   Messages: read_at IS NULL → unread.
 */
// ── Messages-only fast path (used when message=true filter is active) ──────────

async function getMessagesOnly(
  userId: number,
  { offset, limit, q, searchTerm }: { offset: number; limit: number; q?: string; searchTerm: string },
): Promise<GetAnnouncementsResult> {
  const countResult = await db.execute(
    q
      ? sql`
          SELECT COUNT(*) AS total
          FROM messages m
          LEFT JOIN users u ON u.id = m.author_id
          WHERE m.user_id = ${userId}
            AND m.message_id IS NULL
            AND m.deleted_at IS NULL
            AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
            AND (m.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
        `
      : sql`
          SELECT COUNT(*) AS total
          FROM messages m
          WHERE m.user_id = ${userId}
            AND m.message_id IS NULL
            AND m.deleted_at IS NULL
            AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
        `,
  )

  const total = normalizeCount(countResult)
  if (total === 0) return { announcements: [], total: 0 }

  const dataResult = await db.execute(
    q
      ? sql`
          SELECT
            'm'          AS source,
            m.id,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS subject,
            u.name       AS authorName,
            m.created_at AS createdAt,
            1            AS isForYou,
            JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type,
            CASE WHEN m.read_at IS NULL THEN 1 ELSE 0 END AS isUnread
          FROM messages m
          LEFT JOIN users u ON u.id = m.author_id
          WHERE m.user_id = ${userId}
            AND m.message_id IS NULL
            AND m.deleted_at IS NULL
            AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
            AND (m.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
          ORDER BY m.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT
            'm'          AS source,
            m.id,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS subject,
            u.name       AS authorName,
            m.created_at AS createdAt,
            1            AS isForYou,
            JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type,
            CASE WHEN m.read_at IS NULL THEN 1 ELSE 0 END AS isUnread
          FROM messages m
          LEFT JOIN users u ON u.id = m.author_id
          WHERE m.user_id = ${userId}
            AND m.message_id IS NULL
            AND m.deleted_at IS NULL
            AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
          ORDER BY m.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  )

  const announcements = normalizeRows(dataResult).map((row) => ({
    id: String(row.id),
    source: 'm' as const,
    title: String(row.subject),
    authorName: row.authorName ? String(row.authorName) : '',
    createdAt: row.createdAt ?? '',
    isForYou: true,
    type: row.type ? String(row.type) : null,
    isUnread: Number(row.isUnread) === 1,
  }))

  return { announcements, total }
}

export async function getAnnouncements(
  userId: number,
  { page, limit, q, messagesOnly }: AnnouncementsQueryParams,
): Promise<GetAnnouncementsResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  // When filtering to messages only, skip section-ID resolution entirely
  if (messagesOnly) {
    return getMessagesOnly(userId, { offset, limit, q, searchTerm })
  }

  // ── 1. Resolve section IDs ─────────────────────────────────────────────────
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(
      and(
        eq(sectionUser.userId, userId),
        isNull(sectionUser.deletedAt),
      ),
    )

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(
    Number.isFinite,
  )

  const sectionIdList = sectionIds.length > 0 ? sectionIds.join(', ') : '0'

  // ── 2. COUNT — total matching rows (announcements + messages) ──────────────
  const countResult = await db.execute(
    q
      ? sql`
          SELECT COUNT(*) AS total FROM (
            SELECT a.id
            FROM announcements a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE a.section_id IN (${sql.raw(sectionIdList)})
              AND a.deleted_at IS NULL
              AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
              AND (a.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})

            UNION ALL

            SELECT m.id
            FROM messages m
            LEFT JOIN users u ON u.id = m.author_id
            WHERE m.user_id = ${userId}
              AND m.message_id IS NULL
              AND m.deleted_at IS NULL
              AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
              AND (m.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
          ) combined
        `
      : sql`
          SELECT COUNT(*) AS total FROM (
            SELECT a.id
            FROM announcements a
            WHERE a.section_id IN (${sql.raw(sectionIdList)})
              AND a.deleted_at IS NULL
              AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))

            UNION ALL

            SELECT m.id
            FROM messages m
            WHERE m.user_id = ${userId}
              AND m.message_id IS NULL
              AND m.deleted_at IS NULL
              AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
          ) combined
        `,
  )

  const total = normalizeCount(countResult)
  if (total === 0) return { announcements: [], total: 0 }

  // ── 3. Paginated SELECT ────────────────────────────────────────────────────
  const dataResult = await db.execute(
    q
      ? sql`
          SELECT source, id, subject, authorName, createdAt, isForYou, type, isUnread FROM (
            SELECT
              'a'          AS source,
              a.id,
              a.subject,
              u.name       AS authorName,
              a.created_at AS createdAt,
              0            AS isForYou,
              a.type       AS type,
              CASE
                WHEN a.track_read = 0 OR a.track_read IS NULL THEN 0
                WHEN ar.id IS NULL                             THEN 1
                WHEN ar.is_unread = 1                          THEN 1
                WHEN a.show_as_popup = 1
                 AND ar.popup_display = 1
                 AND ar.read_at IS NULL                        THEN 1
                ELSE 0
              END          AS isUnread
            FROM announcements a
            LEFT JOIN users u ON u.id = a.user_id
            LEFT JOIN announcement_reads ar
              ON ar.announcement_id = a.id
             AND ar.user_id = ${userId}
            WHERE a.section_id IN (${sql.raw(sectionIdList)})
              AND a.deleted_at IS NULL
              AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
              AND (a.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})

            UNION ALL

            SELECT
              'm'          AS source,
              m.id,
              COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS subject,
              u.name       AS authorName,
              m.created_at AS createdAt,
              1            AS isForYou,
              JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type,
              CASE WHEN m.read_at IS NULL THEN 1 ELSE 0 END AS isUnread
            FROM messages m
            LEFT JOIN users u ON u.id = m.author_id
            WHERE m.user_id = ${userId}
              AND m.message_id IS NULL
              AND m.deleted_at IS NULL
              AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
              AND (m.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
          ) combined
          ORDER BY createdAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT source, id, subject, authorName, createdAt, isForYou, type, isUnread FROM (
            SELECT
              'a'          AS source,
              a.id,
              a.subject,
              u.name       AS authorName,
              a.created_at AS createdAt,
              0            AS isForYou,
              a.type       AS type,
              CASE
                WHEN a.track_read = 0 OR a.track_read IS NULL THEN 0
                WHEN ar.id IS NULL                             THEN 1
                WHEN ar.is_unread = 1                          THEN 1
                WHEN a.show_as_popup = 1
                 AND ar.popup_display = 1
                 AND ar.read_at IS NULL                        THEN 1
                ELSE 0
              END          AS isUnread
            FROM announcements a
            LEFT JOIN users u ON u.id = a.user_id
            LEFT JOIN announcement_reads ar
              ON ar.announcement_id = a.id
             AND ar.user_id = ${userId}
            WHERE a.section_id IN (${sql.raw(sectionIdList)})
              AND a.deleted_at IS NULL
              AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))

            UNION ALL

            SELECT
              'm'          AS source,
              m.id,
              COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.title')), m.subject) AS subject,
              u.name       AS authorName,
              m.created_at AS createdAt,
              1            AS isForYou,
              JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type')) AS type,
              CASE WHEN m.read_at IS NULL THEN 1 ELSE 0 END AS isUnread
            FROM messages m
            LEFT JOIN users u ON u.id = m.author_id
            WHERE m.user_id = ${userId}
              AND m.message_id IS NULL
              AND m.deleted_at IS NULL
              AND (m.schedule IS NULL OR m.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
          ) combined
          ORDER BY createdAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  )

  const announcements = normalizeRows(dataResult).map((row) => ({
    id: String(row.id),
    source: String(row.source) === 'm' ? 'm' as const : 'a' as const,
    title: String(row.subject),
    authorName: row.authorName ? String(row.authorName) : '',
    createdAt: row.createdAt ?? '',
    isForYou: Number(row.isForYou) === 1,
    type: row.type ? String(row.type) : null,
    isUnread: Number(row.isUnread) === 1,
  }))

  return { announcements, total }
}
