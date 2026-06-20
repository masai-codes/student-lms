import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { leaderboardPeriodCondition } from './leaderboardPeriod'
import { rankableMemberCondition } from './leaderboardEligibility'
import type { SQL } from 'drizzle-orm'
import type { LeaderboardPeriod } from './leaderboardPeriod'
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
  /** Total points earned across the whole community for the period. */
  points: number
}

/** The top of the board plus the signed-in member's own placement. */
export interface GlobalLeaderboardResult {
  /** Top-ranked members, highest first (at most `limit`). */
  entries: Array<GlobalLeaderboardEntry>
  /**
   * The signed-in member's own row, included even when they fall outside the
   * top `limit`. `null` when they have earned no points in the period.
   */
  currentUser: GlobalLeaderboardEntry | null
}

export interface GlobalLeaderboardOptions {
  /** The signed-in member, whose own placement is always resolved. */
  currentUserId: number
  period?: LeaderboardPeriod
  limit?: number
}

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// SUM can be null for a group with no rows; the read path coerces with `?? 0`.
const POINTS_SUM = sql<number | null>`SUM(${masaiverseLeaderboard.points})`

function clampLimit(limit: number): number {
  return Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT
}

/** The signed-in member's name, avatar and total points for the period. */
async function getCurrentUserEntry(
  currentUserId: number,
  where: SQL | undefined,
): Promise<GlobalLeaderboardEntry | null> {
  const meRows = await db
    .select({
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(
      and(
        eq(masaiverseLeaderboard.userId, currentUserId),
        rankableMemberCondition,
        where,
      ),
    )
    .groupBy(users.name, users.profilePhotoPath)
  const me = meRows.at(0)
  if (!me) return null

  const points = Number(me.points ?? 0)
  // Members ranked strictly higher decide the placement; ties share a rank.
  // Admins are excluded so they never count as ranked above a member.
  const above = await db
    .select({ userId: masaiverseLeaderboard.userId })
    .from(masaiverseLeaderboard)
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(and(rankableMemberCondition, where))
    .groupBy(masaiverseLeaderboard.userId)
    .having(gt(POINTS_SUM, points))

  return {
    rank: above.length + 1,
    userId: String(currentUserId),
    name: me.name,
    avatarUrl: me.avatarUrl ?? null,
    points,
  }
}

/**
 * The global Masaiverse leaderboard: the top `limit` members ranked by total
 * points (all-time, or just the current month), plus the signed-in member's own
 * placement so the UI can pin their row even when they are off the top.
 */
export async function getGlobalLeaderboard({
  currentUserId,
  period = 'overall',
  limit = DEFAULT_LIMIT,
}: GlobalLeaderboardOptions): Promise<GlobalLeaderboardResult> {
  const safeLimit = clampLimit(limit)
  const where = leaderboardPeriodCondition(period)

  const rows = await db
    .select({
      userId: masaiverseLeaderboard.userId,
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(and(rankableMemberCondition, where))
    .groupBy(masaiverseLeaderboard.userId, users.name, users.profilePhotoPath)
    .orderBy(desc(POINTS_SUM))
    .limit(safeLimit)

  const entries = rows.map((row, index) => ({
    rank: index + 1,
    userId: String(row.userId),
    name: row.name,
    avatarUrl: row.avatarUrl ?? null,
    points: Number(row.points ?? 0),
  }))

  const currentUser = await getCurrentUserEntry(currentUserId, where)
  return { entries, currentUser }
}
