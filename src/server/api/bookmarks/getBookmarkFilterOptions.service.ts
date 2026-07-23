import { sql } from 'drizzle-orm'
import { db } from '@/db'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'

const ENTITY = {
  lecture: 'App\\Models\\Lecture',
  assignment: 'App\\Models\\Assignment',
  announcement: 'App\\Models\\Announcement',
  ticket: 'App\\Models\\Ticket',
} as const

export interface BookmarkFilterOptions {
  categories: Array<string>
  modules: Array<string>
  statuses: Array<string>
  priorities: Array<string>
}

function rowsOf(result: unknown): Array<Record<string, unknown>> {
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

/** Distinct, sorted, non-empty values of one column across the result rows. */
function distinct(
  rows: Array<Record<string, unknown>>,
  key: string,
): Array<string> {
  const values = new Set<string>()
  for (const row of rows) {
    const raw = row[key]
    if (raw != null && String(raw).trim() !== '') values.add(String(raw))
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

const EMPTY: BookmarkFilterOptions = {
  categories: [],
  modules: [],
  statuses: [],
  priorities: [],
}

/**
 * Available filter option values for a tab, derived from the user's OWN
 * bookmarked items (so every option yields results). Masaiverse posts have no
 * filterable columns, so it returns empty lists.
 */
export async function getBookmarkFilterOptions(
  userId: number,
  tab: BookmarkTab,
): Promise<BookmarkFilterOptions> {
  if (tab === 'lectures') {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT DISTINCT l.category AS category, l.module AS module
        FROM bookmarks b
        INNER JOIN lectures l ON l.id = b.entity_id
        WHERE b.user_id = ${userId} AND b.entity_type = ${ENTITY.lecture}
          AND b.is_bookmarked = 1 AND l.deleted_at IS NULL
      `),
    )
    return {
      ...EMPTY,
      categories: distinct(rows, 'category'),
      modules: distinct(rows, 'module'),
    }
  }

  if (tab === 'assignments') {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT DISTINCT a.category AS category, a.module AS module
        FROM bookmarks b
        INNER JOIN assignments a ON a.id = b.entity_id
        WHERE b.user_id = ${userId} AND b.entity_type = ${ENTITY.assignment}
          AND b.is_bookmarked = 1 AND a.deleted_at IS NULL
      `),
    )
    return {
      ...EMPTY,
      categories: distinct(rows, 'category'),
      modules: distinct(rows, 'module'),
    }
  }

  if (tab === 'tickets') {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT DISTINCT t.category AS category, t.status AS status,
          t.priority AS priority
        FROM bookmarks b
        INNER JOIN tickets t ON t.id = b.entity_id
        WHERE b.user_id = ${userId} AND b.entity_type = ${ENTITY.ticket}
          AND b.is_bookmarked = 1 AND t.deleted_at IS NULL
      `),
    )
    return {
      ...EMPTY,
      categories: distinct(rows, 'category'),
      statuses: distinct(rows, 'status'),
      priorities: distinct(rows, 'priority'),
    }
  }

  if (tab === 'announcements') {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT DISTINCT a.category AS category
        FROM bookmarks b
        INNER JOIN announcements a ON a.id = b.entity_id
        WHERE b.user_id = ${userId} AND b.entity_type = ${ENTITY.announcement}
          AND b.is_bookmarked = 1 AND a.deleted_at IS NULL
      `),
    )
    return { ...EMPTY, categories: distinct(rows, 'category') }
  }

  return EMPTY
}
