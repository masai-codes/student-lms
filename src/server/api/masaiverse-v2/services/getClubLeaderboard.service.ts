import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { leaderboardPeriodCondition } from './leaderboardPeriod'
import { publishedClubCondition } from './publishVisibility'
import type { SQL } from 'drizzle-orm'
import type { LeaderboardPeriod } from './leaderboardPeriod'
import { db } from '@/db'
import { clubMembers, clubs, masaiverseLeaderboard, users } from '@/db/schema'

/** One ranked member on a club's leaderboard. */
export interface ClubLeaderboardEntry {
  /** 1-based position on the board. */
  rank: number
  userId: string
  name: string
  /** `users.profile_photo_path`; null when the member has no photo. */
  avatarUrl: string | null
  /** Total club-scoped points for the period. */
  points: number
}

/** A club's top members plus the signed-in member's own placement. */
export interface ClubLeaderboardResult {
  /** Top-ranked members, highest first (at most `limit`). */
  entries: Array<ClubLeaderboardEntry>
  /**
   * The signed-in member's own row, included even when off the top. `null` when
   * they have earned no points in this club for the period.
   */
  currentUser: ClubLeaderboardEntry | null
}

export interface ClubLeaderboardOptions {
  clubId: number
  /** The signed-in member, whose own placement is always resolved. */
  currentUserId: number
  period?: LeaderboardPeriod
  limit?: number
  canSeeUnpublished?: boolean
}

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// SUM can be null when a group is empty; the read path coerces with `?? 0`.
const POINTS_SUM = sql<number | null>`SUM(${masaiverseLeaderboard.points})`

function clampLimit(limit: number): number {
  return Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT
}

/** Only members of the club are ranked, scoped to the matching club rows. */
function clubMembersJoin(clubId: number): SQL {
  return and(
    eq(clubMembers.userId, masaiverseLeaderboard.userId),
    eq(clubMembers.clubId, clubId),
  ) as SQL
}

/** The signed-in member's name, avatar and club-scoped points for the period. */
async function getCurrentUserEntry(
  clubId: number,
  currentUserId: number,
  where: SQL,
): Promise<ClubLeaderboardEntry | null> {
  const meRows = await db
    .select({
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(clubMembers, clubMembersJoin(clubId))
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(and(where, eq(masaiverseLeaderboard.userId, currentUserId)))
    .groupBy(users.name, users.profilePhotoPath)
  const me = meRows.at(0)
  if (!me) return null

  const points = Number(me.points ?? 0)
  // Members ranked strictly higher decide the placement; ties share a rank.
  const above = await db
    .select({ userId: masaiverseLeaderboard.userId })
    .from(masaiverseLeaderboard)
    .innerJoin(clubMembers, clubMembersJoin(clubId))
    .where(where)
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
 * A club's leaderboard: the top `limit` members ranked by their club-scoped
 * points (all-time, or just the current month), plus the signed-in member's own
 * placement so the UI can pin their row. Returns `null` when the club does not
 * exist so the route can render a "not found" state.
 */
export async function getClubLeaderboard({
  clubId,
  currentUserId,
  period = 'overall',
  limit = DEFAULT_LIMIT,
  canSeeUnpublished = false,
}: ClubLeaderboardOptions): Promise<ClubLeaderboardResult | null> {
  if (!Number.isFinite(clubId)) return null
  const safeLimit = clampLimit(limit)

  const club = (
    await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(
        and(eq(clubs.id, clubId), publishedClubCondition(canSeeUnpublished)),
      )
      .limit(1)
  ).at(0)
  if (!club) return null

  const where = and(
    eq(masaiverseLeaderboard.clubId, clubId),
    leaderboardPeriodCondition(period),
  ) as SQL

  const rows = await db
    .select({
      userId: masaiverseLeaderboard.userId,
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(clubMembers, clubMembersJoin(clubId))
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(where)
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

  const currentUser = await getCurrentUserEntry(clubId, currentUserId, where)
  return { entries, currentUser }
}
