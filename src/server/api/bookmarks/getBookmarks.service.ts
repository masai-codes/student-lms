import { sql } from 'drizzle-orm'
import { db } from '@/db'
import type { BookmarksQueryParams } from './utils/parseBookmarksQuery'

// ── Entity type constants ──────────────────────────────────────────────────────

const ENTITY = {
  lecture:      "App\\Models\\Lecture",
  assignment:   "App\\Models\\Assignment",
  announcement: "App\\Models\\Announcement",
  message:      "App\\Models\\Message",
  ticket:       "App\\Models\\Ticket",
} as const

// ── Shared types ───────────────────────────────────────────────────────────────

export type BookmarkEntityType =
  | 'lecture'
  | 'resource'
  | 'assignment'
  | 'announcement'
  | 'ticket'

export interface BookmarkItem {
  id: string
  title: string
  subtitle: string
  meta: string
  author: string
  savedAt: string
  entityType: BookmarkEntityType
  isForYou: boolean
}

export interface GetBookmarksResult {
  items: Array<BookmarkItem>
  total: number
}

// ── normalizeRows / normalizeCount ─────────────────────────────────────────────

function normalizeRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

function normalizeCount(result: unknown): number {
  const rows = normalizeRows(result)
  const raw = rows[0]?.['total']
  return raw != null ? Number(raw) : 0
}

function formatSavedAt(dateStr: unknown): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  // e.g. "25 Apr, 3:54 PM (IST)"
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

function str(v: unknown): string {
  return v != null ? String(v) : ''
}

// ── Tab handlers ───────────────────────────────────────────────────────────────

async function getLectures(
  userId: number,
  { page, limit, q }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1
              AND l.deleted_at IS NULL
              AND l.title LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1
              AND l.deleted_at IS NULL
          `,
    ),
    db.execute(
      q
        ? sql`
            SELECT b.id, l.title, l.type AS lectureType,
              l.category, l.module, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            LEFT JOIN users u ON u.id = l.user_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1
              AND l.deleted_at IS NULL
              AND l.title LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, l.title, l.type AS lectureType,
              l.category, l.module, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            LEFT JOIN users u ON u.id = l.user_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1
              AND l.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row) => {
    const isResource = str(row['lectureType']) === 'reading'
    const parts = [row['category'], row['module']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      title: str(row['title']),
      subtitle: parts.join(' — '),
      meta: '',
      author: str(row['authorName']),
      savedAt: formatSavedAt(row['savedAt']),
      entityType: (isResource ? 'resource' : 'lecture') as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

async function getAssignments(
  userId: number,
  { page, limit, q }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.title LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
          `,
    ),
    db.execute(
      q
        ? sql`
            SELECT b.id, a.title, a.category, a.module, b.created_at AS savedAt
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.title LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, a.title, a.category, a.module, b.created_at AS savedAt
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row) => {
    const parts = [row['category'], row['module']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      title: str(row['title']),
      subtitle: parts.join(' — '),
      meta: '',
      author: '',
      savedAt: formatSavedAt(row['savedAt']),
      entityType: 'assignment' as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

async function getAnnouncements(
  userId: number,
  { page, limit, q }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  // Count both announcement + message bookmarks separately then sum
  const [countAnn, countMsg] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.subject LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
          `,
    ),
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN messages m ON m.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.message}
              AND b.is_bookmarked = 1
              AND m.deleted_at IS NULL
              AND m.subject LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN messages m ON m.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.message}
              AND b.is_bookmarked = 1
              AND m.deleted_at IS NULL
          `,
    ),
  ])

  const total = normalizeCount(countAnn) + normalizeCount(countMsg)

  if (total === 0) return { items: [], total: 0 }

  // Paginated UNION — both entity types share the same result shape
  const dataResult = await db.execute(
    q
      ? sql`
          (
            SELECT b.id, a.subject AS title, a.category AS subtitle,
              b.created_at AS savedAt, 0 AS isForYou
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.subject LIKE ${searchTerm}
          )
          UNION ALL
          (
            SELECT b.id, m.subject AS title, '' AS subtitle,
              b.created_at AS savedAt, 1 AS isForYou
            FROM bookmarks b
            INNER JOIN messages m ON m.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.message}
              AND b.is_bookmarked = 1
              AND m.deleted_at IS NULL
              AND m.subject LIKE ${searchTerm}
          )
          ORDER BY savedAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          (
            SELECT b.id, a.subject AS title, a.category AS subtitle,
              b.created_at AS savedAt, 0 AS isForYou
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
          )
          UNION ALL
          (
            SELECT b.id, m.subject AS title, '' AS subtitle,
              b.created_at AS savedAt, 1 AS isForYou
            FROM bookmarks b
            INNER JOIN messages m ON m.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.message}
              AND b.is_bookmarked = 1
              AND m.deleted_at IS NULL
          )
          ORDER BY savedAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  )

  const items = normalizeRows(dataResult).map((row) => ({
    id: str(row['id']),
    title: str(row['title']),
    subtitle: str(row['subtitle']),
    meta: '',
    author: '',
    savedAt: formatSavedAt(row['savedAt']),
    entityType: 'announcement' as BookmarkEntityType,
    isForYou: Number(row['isForYou']) === 1,
  }))

  return { items, total }
}

async function getTickets(
  userId: number,
  { page, limit, q }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.ticket}
              AND b.is_bookmarked = 1
              AND t.deleted_at IS NULL
              AND t.title LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.ticket}
              AND b.is_bookmarked = 1
              AND t.deleted_at IS NULL
          `,
    ),
    db.execute(
      q
        ? sql`
            SELECT b.id, t.title, t.category, t.status, t.priority,
              b.created_at AS savedAt
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.ticket}
              AND b.is_bookmarked = 1
              AND t.deleted_at IS NULL
              AND t.title LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, t.title, t.category, t.status, t.priority,
              b.created_at AS savedAt
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.ticket}
              AND b.is_bookmarked = 1
              AND t.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row) => {
    const metaParts = [row['status'], row['priority']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      title: str(row['title']),
      subtitle: str(row['category']),
      meta: metaParts.join(' · '),
      author: '',
      savedAt: formatSavedAt(row['savedAt']),
      entityType: 'ticket' as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function getBookmarks(
  userId: number,
  params: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  switch (params.tab) {
    case 'lectures':
      return getLectures(userId, params)
    case 'assignments':
      return getAssignments(userId, params)
    case 'announcements':
      return getAnnouncements(userId, params)
    case 'tickets':
      return getTickets(userId, params)
    case 'masaiverse':
      return { items: [], total: 0 }
  }
}
