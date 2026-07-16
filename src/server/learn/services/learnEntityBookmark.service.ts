import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { bookmarks } from '@/db/schema'

/**
 * Learn entities that can be bookmarked from a detail page.
 * Resources are `reading` lectures, so they share the lecture entity type
 * (matches legacy `App\Models\Lecture` rows).
 */
export type LearnBookmarkEntityKind = 'lecture' | 'resource' | 'assignment'

const ENTITY_TYPE_BY_KIND: Record<LearnBookmarkEntityKind, string> = {
  lecture: 'App\\Models\\Lecture',
  resource: 'App\\Models\\Lecture',
  assignment: 'App\\Models\\Assignment',
}

const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`
const BOOKMARKED = 1

function entityTypeFor(kind: LearnBookmarkEntityKind): string {
  return ENTITY_TYPE_BY_KIND[kind]
}

/** True when the user has an active bookmark row for the entity. */
export async function getLearnEntityBookmarkState(
  userId: number,
  kind: LearnBookmarkEntityKind,
  entityId: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.entityType, entityTypeFor(kind)),
        eq(bookmarks.entityId, entityId),
        eq(bookmarks.isBookmarked, BOOKMARKED),
      ),
    )
    .limit(1)

  return rows.length > 0
}

/** Add (or reactivate) a bookmark — idempotent. */
export async function addLearnEntityBookmark(
  userId: number,
  kind: LearnBookmarkEntityKind,
  entityId: number,
): Promise<void> {
  const entityType = entityTypeFor(kind)

  const existing = await db
    .select({ id: bookmarks.id, isBookmarked: bookmarks.isBookmarked })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.entityType, entityType),
        eq(bookmarks.entityId, entityId),
      ),
    )
    .limit(1)

  if (existing.length === 0) {
    await db.insert(bookmarks).values({
      userId,
      entityType,
      entityId,
      isBookmarked: BOOKMARKED,
      createdAt: NOW_IST,
      updatedAt: NOW_IST,
    })
    return
  }

  const current = existing[0]
  if (current.isBookmarked !== BOOKMARKED) {
    await db
      .update(bookmarks)
      .set({ isBookmarked: BOOKMARKED, updatedAt: NOW_IST })
      .where(eq(bookmarks.id, current.id))
  }
}

/** Remove the user's bookmark for the entity — idempotent. */
export async function removeLearnEntityBookmark(
  userId: number,
  kind: LearnBookmarkEntityKind,
  entityId: number,
): Promise<void> {
  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.entityType, entityTypeFor(kind)),
        eq(bookmarks.entityId, entityId),
      ),
    )
}
