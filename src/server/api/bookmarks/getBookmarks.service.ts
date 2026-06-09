import { sql } from 'drizzle-orm'
import { db } from '@/db'
import type { BookmarksQueryParams } from './utils/parseBookmarksQuery'

// ── Entity type constants ──────────────────────────────────────────────────────

const ENTITY = {
  lecture:      "App\\Models\\Lecture",
  assignment:   "App\\Models\\Assignment",
  announcement: "App\\Models\\Announcement",
  ticket:       "App\\Models\\Ticket",
} as const

// ── Shared types ───────────────────────────────────────────────────────────────

export type BookmarkEntityType =
  | 'lecture'
  | 'resource'
  | 'assignment'
  | 'announcement'
  | 'ticket'
  | 'masaiverse'

export interface BookmarkItem {
  id: string
  /** URL to navigate to when the card is clicked */
  ctaUrl: string
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

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function str(v: unknown): string {
  return v != null ? String(v) : ''
}

// savedAt is returned as a raw timestamp — formatted client-side (IST tooltip handled in UI)
function savedAt(raw: unknown): string {
  return str(raw)
}

// ── Tab: Lectures ──────────────────────────────────────────────────────────────

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
            SELECT b.id, b.entity_id AS entityId, l.title, l.type AS lectureType,
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
            SELECT b.id, b.entity_id AS entityId, l.title, l.type AS lectureType,
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
    const entityId = str(row['entityId'])
    const parts = [row['category'], row['module']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      ctaUrl: `/lectures/${entityId}`,
      title: str(row['title']),
      subtitle: parts.join(' — '),
      meta: '',
      author: str(row['authorName']),
      savedAt: savedAt(row['savedAt']),
      entityType: (isResource ? 'resource' : 'lecture') as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

// ── Tab: Assignments ───────────────────────────────────────────────────────────

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
            SELECT b.id, b.entity_id AS entityId, a.title, a.category, a.module,
              b.created_at AS savedAt, u.name AS authorName
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            LEFT JOIN users u ON u.id = a.user_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.title LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, b.entity_id AS entityId, a.title, a.category, a.module,
              b.created_at AS savedAt, u.name AS authorName
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            LEFT JOIN users u ON u.id = a.user_id
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
    const entityId = str(row['entityId'])
    const parts = [row['category'], row['module']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      ctaUrl: `/assignments/${entityId}`,
      title: str(row['title']),
      subtitle: parts.join(' — '),
      meta: '',
      author: str(row['authorName']),
      savedAt: savedAt(row['savedAt']),
      entityType: 'assignment' as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

// ── Tab: Tickets ───────────────────────────────────────────────────────────────

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
            SELECT b.id, b.entity_id AS entityId, t.title, t.category,
              t.status, t.priority, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            LEFT JOIN users u ON u.id = t.assignee_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.ticket}
              AND b.is_bookmarked = 1
              AND t.deleted_at IS NULL
              AND t.title LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, b.entity_id AS entityId, t.title, t.category,
              t.status, t.priority, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN tickets t ON t.id = b.entity_id
            LEFT JOIN users u ON u.id = t.assignee_id
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
    const entityId = str(row['entityId'])
    const metaParts = [row['status'], row['priority']].map(str).filter(Boolean)
    return {
      id: str(row['id']),
      ctaUrl: `/support/${entityId}`,
      title: str(row['title']),
      subtitle: str(row['category']),
      meta: metaParts.join(' · '),
      author: str(row['authorName']),
      savedAt: savedAt(row['savedAt']),
      entityType: 'ticket' as BookmarkEntityType,
      isForYou: false,
    }
  })

  return { items, total }
}

// ── Tab: Announcements ─────────────────────────────────────────────────────────
// Only queries the announcements table (App\Models\Announcement).
// Messages are excluded per spec — they are not surfaced in this tab.

async function getAnnouncements(
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
            SELECT b.id, b.entity_id AS entityId, a.subject AS title,
              a.category AS subtitle, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            LEFT JOIN users u ON u.id = a.user_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
              AND a.subject LIKE ${searchTerm}
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT b.id, b.entity_id AS entityId, a.subject AS title,
              a.category AS subtitle, b.created_at AS savedAt,
              u.name AS authorName
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            LEFT JOIN users u ON u.id = a.user_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1
              AND a.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row) => ({
    id: str(row['id']),
    ctaUrl: `/announcements/${str(row['entityId'])}`,
    title: str(row['title']),
    subtitle: str(row['subtitle']),
    meta: '',
    author: str(row['authorName']),
    savedAt: savedAt(row['savedAt']),
    entityType: 'announcement' as BookmarkEntityType,
    isForYou: false,
  }))

  return { items, total }
}

// ── Tab: Masaiverse ────────────────────────────────────────────────────────────
// Uses club_post_bookmarks + posts (not the bookmarks table).

async function getMasaiverse(
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
            FROM club_post_bookmarks cpb
            INNER JOIN posts cp ON cp.id = cpb.post_id
            WHERE cpb.user_id = ${userId}
              AND cp.content LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM club_post_bookmarks cpb
            WHERE cpb.user_id = ${userId}
          `,
    ),
    db.execute(
      q
        ? sql`
            SELECT cpb.id, cpb.post_id AS entityId, cp.content,
              cpb.created_at AS savedAt, u.name AS authorName
            FROM club_post_bookmarks cpb
            INNER JOIN posts cp ON cp.id = cpb.post_id
            LEFT JOIN users u ON u.id = cp.user_id
            WHERE cpb.user_id = ${userId}
              AND cp.content LIKE ${searchTerm}
            ORDER BY cpb.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : sql`
            SELECT cpb.id, cpb.post_id AS entityId, cp.content,
              cpb.created_at AS savedAt, u.name AS authorName
            FROM club_post_bookmarks cpb
            INNER JOIN posts cp ON cp.id = cpb.post_id
            LEFT JOIN users u ON u.id = cp.user_id
            WHERE cpb.user_id = ${userId}
            ORDER BY cpb.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row) => {
    const entityId = str(row['entityId'])
    // Truncate long post content for the title display
    const content = str(row['content'])
    const title = content.length > 120 ? `${content.slice(0, 120)}…` : content
    return {
      id: str(row['id']),
      ctaUrl: `/masaiverse?tab=home&postId=${entityId}`,
      title,
      subtitle: '',
      meta: '',
      author: str(row['authorName']),
      savedAt: savedAt(row['savedAt']),
      entityType: 'masaiverse' as BookmarkEntityType,
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
    case 'lectures':      return getLectures(userId, params)
    case 'assignments':   return getAssignments(userId, params)
    case 'tickets':       return getTickets(userId, params)
    case 'announcements': return getAnnouncements(userId, params)
    case 'masaiverse':    return getMasaiverse(userId, params)
  }
}
