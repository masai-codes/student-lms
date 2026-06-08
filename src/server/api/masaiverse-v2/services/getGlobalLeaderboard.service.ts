import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { masaiverseLeaderboard, users } from '@/db/schema'

/** One ranked person on the community-wide (global) leaderboard. */
export interface GlobalLeaderboardEntry {
  /** 1-based position across the whole community. */
  rank: number
  userId: string
  name: string
  /** `users.profile_photo_path`; null when the member has no photo. */
  avatarUrl: string | null
  /** Total points earned across the whole community, all-time. */
  points: number
}

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// SUM can be null for a group with no rows; the read path coerces with `?? 0`.
const POINTS_SUM = sql<number | null>`SUM(${masaiverseLeaderboard.points})`

/**
 * The global Masaiverse leaderboard: every member ranked by their total points
 * across the whole community, all-time (not club-scoped, not month-scoped),
 * highest first. Returns at most `limit` entries (clamped to a sane range).
 */
export async function getGlobalLeaderboard(
  limit = DEFAULT_LIMIT,
): Promise<Array<GlobalLeaderboardEntry>> {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  const rows = await db
    .select({
      userId: masaiverseLeaderboard.userId,
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .groupBy(masaiverseLeaderboard.userId, users.name, users.profilePhotoPath)
    .orderBy(desc(POINTS_SUM))
    .limit(safeLimit)

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: String(row.userId),
    name: row.name,
    avatarUrl: row.avatarUrl ?? null,
    points: Number(row.points ?? 0),
  }))
}
