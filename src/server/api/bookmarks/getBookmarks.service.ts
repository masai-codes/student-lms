import { sql } from 'drizzle-orm'
import { db } from '@/db'
import type { BookmarksQueryParams } from './utils/parseBookmarksQuery'
import {
  buildInClauses,
  buildLectureTypeClause,
  buildSavedDateClause,
} from './utils/buildBookmarkFilterClauses'

// ── Entity type constants ──────────────────────────────────────────────────────

const ENTITY = {
  lecture: 'App\\Models\\Lecture',
  assignment: 'App\\Models\\Assignment',
  announcement: 'App\\Models\\Announcement',
  ticket: 'App\\Models\\Ticket',
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
  {
    page,
    limit,
    q,
    categories,
    modules,
    types,
    startDate,
    endDate,
  }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`
  const filterClause = sql`${buildInClauses([
    { column: sql`l.category`, values: categories },
    { column: sql`l.module`, values: modules },
  ])}${buildLectureTypeClause(types)}${buildSavedDateClause(sql`b.created_at`, startDate, endDate)}`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1${filterClause}
              AND l.deleted_at IS NULL
              AND l.title LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN lectures l ON l.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.lecture}
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
              AND l.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row): BookmarkItem => {
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
      entityType: isResource ? 'resource' : 'lecture',
      isForYou: false,
    }
  })

  return { items, total }
}

// ── Tab: Assignments ───────────────────────────────────────────────────────────

async function getAssignments(
  userId: number,
  {
    page,
    limit,
    q,
    categories,
    modules,
    startDate,
    endDate,
  }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`
  const filterClause = sql`${buildInClauses([
    { column: sql`a.category`, values: categories },
    { column: sql`a.module`, values: modules },
  ])}${buildSavedDateClause(sql`b.created_at`, startDate, endDate)}`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1${filterClause}
              AND a.deleted_at IS NULL
              AND a.title LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN assignments a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.assignment}
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
              AND a.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map((row): BookmarkItem => {
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
      entityType: 'assignment',
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
  {
    page,
    limit,
    q,
    categories,
    types,
    startDate,
    endDate,
  }: BookmarksQueryParams,
): Promise<GetBookmarksResult> {
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`
  const filterClause = sql`${buildInClauses([
    { column: sql`a.category`, values: categories },
    { column: sql`a.type`, values: types },
  ])}${buildSavedDateClause(sql`b.created_at`, startDate, endDate)}`

  const [countResult, dataResult] = await Promise.all([
    db.execute(
      q
        ? sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1${filterClause}
              AND a.deleted_at IS NULL
              AND a.subject LIKE ${searchTerm}
          `
        : sql`
            SELECT COUNT(*) AS total
            FROM bookmarks b
            INNER JOIN announcements a ON a.id = b.entity_id
            WHERE b.user_id = ${userId}
              AND b.entity_type = ${ENTITY.announcement}
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
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
              AND b.is_bookmarked = 1${filterClause}
              AND a.deleted_at IS NULL
            ORDER BY b.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
    ),
  ])

  const total = normalizeCount(countResult)
  const items = normalizeRows(dataResult).map(
    (row): BookmarkItem => ({
      id: str(row['id']),
      ctaUrl: `/announcements/${str(row['entityId'])}`,
      title: str(row['title']),
      subtitle: str(row['subtitle']),
      meta: '',
      author: str(row['authorName']),
      savedAt: savedAt(row['savedAt']),
      entityType: 'announcement',
      isForYou: false,
    }),
  )

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
  }
}
