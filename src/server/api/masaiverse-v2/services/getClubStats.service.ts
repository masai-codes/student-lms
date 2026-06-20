import { and, avg, count, eq, gte, sql } from 'drizzle-orm'
import { publishedClubCondition } from './publishVisibility'
import { db } from '@/db'
import {
  clubMembers,
  clubs,
  eventEnrollments,
  events,
  posts,
  replies,
} from '@/db/schema'

/** Headline metrics shown in the club detail "stats" section. */
export interface MasaiverseV2ClubStats {
  /** Members whose `meta.lastVisitedAt` falls within the last 30 days. */
  activeMembers: number
  /**
   * Average of every `event_enrollments.meta.rating` across the club's events,
   * rounded to one decimal. `null` when no enrollment carries a rating.
   */
  avgEventRating: number | null
  /** `clubs.meta.projectsBuild` — a hardcoded number; 0 when unset/invalid. */
  projectsBuilt: number
  /** Posts that belong to the club plus replies made on those posts. */
  communityPosts: number
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** Member-side JSON path: `club_members.meta -> '$.lastVisitedAt'` as text. */
const LAST_VISITED_AT = sql<string>`json_unquote(json_extract(${clubMembers.meta}, '$.lastVisitedAt'))`
/** Enrollment-side JSON path: `event_enrollments.meta -> '$.rating'` as number. */
const ENROLLMENT_RATING = sql<string>`json_extract(${eventEnrollments.meta}, '$.rating')`

async function getActiveMembers(clubId: number, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS).toISOString()
  const rows = await db
    .select({ count: count() })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), gte(LAST_VISITED_AT, cutoff)))
  return rows.at(0)?.count ?? 0
}

async function getAvgEventRating(clubId: number): Promise<number | null> {
  const rows = await db
    .select({ avgRating: avg(ENROLLMENT_RATING) })
    .from(eventEnrollments)
    .innerJoin(events, eq(eventEnrollments.eventId, events.id))
    .where(eq(events.clubId, clubId))
  const raw = rows.at(0)?.avgRating
  if (raw == null) return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null
}

function toProjectsBuilt(value: unknown): number {
  const num = typeof value === 'string' ? Number(value) : value
  return typeof num === 'number' && Number.isFinite(num) ? num : 0
}

async function getCommunityPosts(clubId: number): Promise<number> {
  const [postRows, replyRows] = await Promise.all([
    db.select({ count: count() }).from(posts).where(eq(posts.clubId, clubId)),
    db
      .select({ count: count() })
      .from(replies)
      .innerJoin(posts, eq(replies.postId, posts.id))
      .where(eq(posts.clubId, clubId)),
  ])
  return (postRows.at(0)?.count ?? 0) + (replyRows.at(0)?.count ?? 0)
}

/**
 * Aggregates the four club-detail headline stats. Returns `null` when no club
 * matches the id so the route can render a "not found" state. Each metric is
 * derived live except `projectsBuilt`, which is read from `clubs.meta`.
 */
export async function getClubStats(
  clubId: number,
  now: Date = new Date(),
  canSeeUnpublished = false,
): Promise<MasaiverseV2ClubStats | null> {
  if (!Number.isFinite(clubId)) return null

  const club = (
    await db
      .select({ meta: clubs.meta })
      .from(clubs)
      .where(
        and(eq(clubs.id, clubId), publishedClubCondition(canSeeUnpublished)),
      )
      .limit(1)
  ).at(0)

  if (!club) return null

  const [activeMembers, avgEventRating, communityPosts] = await Promise.all([
    getActiveMembers(clubId, now),
    getAvgEventRating(clubId),
    getCommunityPosts(clubId),
  ])

  return {
    activeMembers,
    avgEventRating,
    projectsBuilt: toProjectsBuilt(club.meta?.projectsBuild),
    communityPosts,
  }
}
