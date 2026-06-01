import { and, eq, isNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { sectionUser } from '@/db/schema'
import type { AnnouncementsQueryParams } from './utils/parseAnnouncementsQuery'

export interface AnnouncementItem {
  id: string
  title: string
  authorName: string
  date: string
  isForYou: boolean
}

export interface GetAnnouncementsResult {
  items: Array<AnnouncementItem>
  total: number
}

type RawRow = {
  id: number | string | bigint
  subject: string
  authorName: string | null
  createdAt: string | null
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Fetches a paginated, optionally-searched page of announcements for the user.
 *
 * Flow:
 *  1. Resolve section_ids the user is enrolled in via section_user.
 *  2. Run COUNT(*) to get total matching rows (for pagination).
 *  3. Run paginated SELECT with LIMIT / OFFSET.
 *
 * Search (q) is applied server-side via LIKE on subject and author name.
 */
export async function getAnnouncements(
  userId: number,
  { page, limit, q }: AnnouncementsQueryParams,
): Promise<GetAnnouncementsResult> {
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

  if (sectionIds.length === 0) return { items: [], total: 0 }

  // sectionIds come from our own DB query — safe to inline
  const sectionIdList = sectionIds.join(', ')
  const offset = (page - 1) * limit
  const searchTerm = `%${q ?? ''}%`

  // ── 2. COUNT — total matching rows ─────────────────────────────────────────
  const countResult = await db.execute(
    q
      ? sql`
          SELECT COUNT(*) AS total
          FROM announcements a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.section_id IN (${sql.raw(sectionIdList)})
            AND a.deleted_at IS NULL
            AND (a.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
        `
      : sql`
          SELECT COUNT(*) AS total
          FROM announcements a
          WHERE a.section_id IN (${sql.raw(sectionIdList)})
            AND a.deleted_at IS NULL
        `,
  )

  const total = normalizeCount(countResult)

  if (total === 0) return { items: [], total: 0 }

  // ── 3. Paginated SELECT ────────────────────────────────────────────────────
  const dataResult = await db.execute(
    q
      ? sql`
          SELECT
            a.id,
            a.subject,
            u.name       AS authorName,
            a.created_at AS createdAt
          FROM announcements a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.section_id IN (${sql.raw(sectionIdList)})
            AND a.deleted_at IS NULL
            AND (a.subject LIKE ${searchTerm} OR u.name LIKE ${searchTerm})
          ORDER BY a.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT
            a.id,
            a.subject,
            u.name       AS authorName,
            a.created_at AS createdAt
          FROM announcements a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.section_id IN (${sql.raw(sectionIdList)})
            AND a.deleted_at IS NULL
          ORDER BY a.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  )

  const items = normalizeRows(dataResult).map((row) => ({
    id: String(row.id),
    title: String(row.subject),
    authorName: row.authorName ? String(row.authorName) : '',
    date: formatDate(row.createdAt),
    isForYou: false,
  }))

  return { items, total }
}
