import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  clubMembers,
  clubs,
  eventEnrollments,
  events,
  masaiverseLeaderboard,
  posts,
  users,
} from '@/db/schema'

/** One ranked member on a club's leaderboard. */
export interface ClubLeaderboardEntry {
  /** 1-based position across the whole board (carries across pages). */
  rank: number
  userId: string
  name: string
  /** `users.profile_photo_path`; null when the member has no photo. */
  avatarUrl: string | null
  /** Total club-scoped points. */
  points: number
  /** Posts the member authored in this club ("projects" in the design). */
  postsCount: number
  /** Events in this club the member enrolled in. */
  eventsCount: number
}

/** A page of a club's leaderboard. */
export interface ClubLeaderboardPage {
  entries: Array<ClubLeaderboardEntry>
  /** 0-based page index echoed back. */
  page: number
  perPage: number
  /** Total ranked members (club members with club-scoped points). */
  total: number
  /** True when more ranked members exist beyond this page. */
  hasMore: boolean
}

const DEFAULT_PER_PAGE = 5
const MAX_PER_PAGE = 50

// SUM can be null when a group is empty; the read path coerces with `?? 0`.
const POINTS_SUM = sql<number | null>`SUM(${masaiverseLeaderboard.points})`

/** Posts authored per user within the club, for the given user ids. */
async function getPostsCounts(
  clubId: number,
  userIds: Array<number>,
): Promise<Map<number, number>> {
  const rows = await db
    .select({ userId: posts.userId, total: count() })
    .from(posts)
    .where(and(eq(posts.clubId, clubId), inArray(posts.userId, userIds)))
    .groupBy(posts.userId)
  return new Map(rows.map((row) => [row.userId, Number(row.total)]))
}

/** Event enrollments per user within the club, for the given user ids. */
async function getEventsCounts(
  clubId: number,
  userIds: Array<number>,
): Promise<Map<number, number>> {
  const rows = await db
    .select({ userId: eventEnrollments.userId, total: count() })
    .from(eventEnrollments)
    .innerJoin(events, eq(events.id, eventEnrollments.eventId))
    .where(
      and(eq(events.clubId, clubId), inArray(eventEnrollments.userId, userIds)),
    )
    .groupBy(eventEnrollments.userId)
  return new Map(rows.map((row) => [row.userId, Number(row.total)]))
}

/**
 * A page of a club's leaderboard. Only members of the club are ranked, and only
 * points whose `club_id` matches are summed. Returns `null` when the club does
 * not exist so the route can render a "not found" state.
 */
export async function getClubLeaderboard(
  clubId: number,
  page = 0,
  perPage = DEFAULT_PER_PAGE,
): Promise<ClubLeaderboardPage | null> {
  if (!Number.isFinite(clubId)) return null
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0
  const safePerPage = Number.isFinite(perPage)
    ? Math.min(Math.max(Math.floor(perPage), 1), MAX_PER_PAGE)
    : DEFAULT_PER_PAGE

  const club = (
    await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1)
  ).at(0)
  if (!club) return null

  const totalRow = (
    await db
      .select({
        total: sql<number>`COUNT(DISTINCT ${masaiverseLeaderboard.userId})`,
      })
      .from(masaiverseLeaderboard)
      .innerJoin(
        clubMembers,
        and(
          eq(clubMembers.userId, masaiverseLeaderboard.userId),
          eq(clubMembers.clubId, clubId),
        ),
      )
      .where(eq(masaiverseLeaderboard.clubId, clubId))
  ).at(0)
  const total = Number(totalRow?.total ?? 0)

  // One extra row tells us whether another page exists.
  const ranked = await db
    .select({
      userId: masaiverseLeaderboard.userId,
      name: users.name,
      avatarUrl: users.profilePhotoPath,
      points: POINTS_SUM,
    })
    .from(masaiverseLeaderboard)
    .innerJoin(
      clubMembers,
      and(
        eq(clubMembers.userId, masaiverseLeaderboard.userId),
        eq(clubMembers.clubId, clubId),
      ),
    )
    .innerJoin(users, eq(users.id, masaiverseLeaderboard.userId))
    .where(eq(masaiverseLeaderboard.clubId, clubId))
    .groupBy(masaiverseLeaderboard.userId, users.name, users.profilePhotoPath)
    .orderBy(desc(POINTS_SUM))
    .limit(safePerPage + 1)
    .offset(safePage * safePerPage)

  const hasMore = ranked.length > safePerPage
  const pageRows = hasMore ? ranked.slice(0, safePerPage) : ranked
  if (pageRows.length === 0) {
    return {
      entries: [],
      page: safePage,
      perPage: safePerPage,
      total,
      hasMore: false,
    }
  }

  const userIds = pageRows.map((row) => row.userId)
  const [postsCounts, eventsCounts] = await Promise.all([
    getPostsCounts(clubId, userIds),
    getEventsCounts(clubId, userIds),
  ])

  const entries = pageRows.map((row, index) => ({
    rank: safePage * safePerPage + index + 1,
    userId: String(row.userId),
    name: row.name,
    avatarUrl: row.avatarUrl ?? null,
    points: Number(row.points ?? 0),
    postsCount: postsCounts.get(row.userId) ?? 0,
    eventsCount: eventsCounts.get(row.userId) ?? 0,
  }))

  return { entries, page: safePage, perPage: safePerPage, total, hasMore }
}
