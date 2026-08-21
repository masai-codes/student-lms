import { sql } from 'drizzle-orm'
import { db } from '@/db'

const ENTITY_TYPE = 'App\\Models\\Announcement'
const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

export interface BookmarkState {
  isBookmarked: boolean
  bookmarkId: number | null
}

function extractRows(result: unknown): Array<Record<string, unknown>> {
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

/** Fetch the current bookmark state for a user + announcement. */
export async function getAnnouncementBookmarkState(
  userId: number,
  entityId: number,
): Promise<BookmarkState> {
  const result = await db.execute(sql`
    SELECT id FROM bookmarks
    WHERE user_id    = ${userId}
      AND entity_id  = ${entityId}
      AND entity_type = ${ENTITY_TYPE}
    ORDER BY id DESC
    LIMIT 1
  `)

  const row = extractRows(result)[0]
  if (!row) return { isBookmarked: false, bookmarkId: null }
  return { isBookmarked: true, bookmarkId: Number(row.id) }
}

/** Add a bookmark — idempotent (returns existing row id if already bookmarked). */
export async function addAnnouncementBookmark(
  userId: number,
  entityId: number,
): Promise<number> {
  // Check for existing row first
  const existing = await getAnnouncementBookmarkState(userId, entityId)
  if (existing.isBookmarked && existing.bookmarkId != null) {
    return existing.bookmarkId
  }

  const result = await db.execute(sql`
    INSERT INTO bookmarks (user_id, entity_id, entity_type, is_bookmarked, created_at, updated_at)
    VALUES (${userId}, ${entityId}, ${ENTITY_TYPE}, 1, ${NOW_IST}, ${NOW_IST})
  `)

  // mysql2 returns [ResultSetHeader, FieldPacket[]] — insertId lives on the first element
  const header = Array.isArray(result) ? result[0] : result
  const insertId = (header as { insertId?: number | bigint })?.insertId
  return insertId ? Number(insertId) : 0
}

/** Remove a bookmark by its row id. */
export async function removeAnnouncementBookmark(
  bookmarkId: number,
): Promise<void> {
  await db.execute(sql`
    DELETE FROM bookmarks WHERE id = ${bookmarkId}
  `)
}
