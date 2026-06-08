import type { MasaiverseV2HomeData } from '@/server/api/masaiverse-v2/getMasaiverseV2Home.service'
import type { CommunityDiscussionsPage } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import type { DiscussionVoteState } from '@/server/api/masaiverse-v2/services/voteCommunityDiscussion.service'
import type { MasaiverseV2Reply } from '@/server/api/masaiverse-v2/services/getDiscussionReplies.service'
import type { MasaiverseV2SidebarClub } from '@/server/api/masaiverse-v2/services/getMyClubs.service'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import type { MasaiverseV2ClubStats } from '@/server/api/masaiverse-v2/services/getClubStats.service'
import type { ClubLeaderboardPage } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'
import type { GlobalLeaderboardEntry } from '@/server/api/masaiverse-v2/services/getGlobalLeaderboard.service'
import type { MasaiverseV2ClubEvents } from '@/server/api/masaiverse-v2/services/getClubEvents.service'
import type { ClubMembershipState } from '@/server/api/masaiverse-v2/services/setClubMembership.service'
import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import type { EventEnrollmentState } from '@/server/api/masaiverse-v2/services/setEventEnrollment.service'
import type { EventRatingState } from '@/server/api/masaiverse-v2/services/rateEvent.service'
import type { MasaiverseV2AdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import type { MasaiverseV2Banner } from '@/server/api/masaiverse-v2/services/getBanners.service'
import { fetchJson } from '@/lib/api/fetchJson'
import { MASAIVERSE_V2_API } from '@/lib/api/masaiverse-v2/masaiverseV2Paths'

export async function fetchMasaiverseV2Home(): Promise<MasaiverseV2HomeData> {
  return fetchJson<MasaiverseV2HomeData>(MASAIVERSE_V2_API.home)
}

/**
 * Records that the user has opened a Masaiverse page at least once, setting
 * `users.meta.isMasaiverseVisitedOnce`. Idempotent on the server.
 */
export async function markMasaiverseV2Visited(): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(MASAIVERSE_V2_API.visited, {
    method: 'POST',
  })
}

/**
 * A page of discussions (paginated, newest first, optional search). Pass a
 * `clubId` to scope the feed to a single club; omit it for the community feed.
 */
export async function fetchMasaiverseV2Discussions(input: {
  offset: number
  limit: number
  q?: string
  clubId?: string
}): Promise<CommunityDiscussionsPage> {
  const params = new URLSearchParams({
    offset: String(input.offset),
    limit: String(input.limit),
  })
  if (input.q) params.set('q', input.q)
  if (input.clubId) params.set('clubId', input.clubId)
  return fetchJson<CommunityDiscussionsPage>(
    `${MASAIVERSE_V2_API.discussions}?${params.toString()}`,
  )
}

/**
 * Creates a discussion post (title + rich-text content + tags). Pass a
 * `clubId` to post it to that club; omit it for a club-less community post.
 */
export async function createMasaiverseV2Discussion(input: {
  title: string
  content: string
  tags: Array<string>
  clubId?: string
}): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(MASAIVERSE_V2_API.discussions, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Toggles the user's upvote/downvote on a discussion post. */
export async function voteMasaiverseV2Discussion(input: {
  postId: string
  vote: 'upvote' | 'downvote'
}): Promise<DiscussionVoteState> {
  return fetchJson<DiscussionVoteState>(MASAIVERSE_V2_API.discussionVote, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Toggles the user's upvote/downvote on a reply. */
export async function voteMasaiverseV2Reply(input: {
  replyId: string
  vote: 'upvote' | 'downvote'
}): Promise<DiscussionVoteState> {
  return fetchJson<DiscussionVoteState>(MASAIVERSE_V2_API.discussionVote, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Replies for a discussion post. */
export async function fetchMasaiverseV2DiscussionReplies(
  postId: string,
): Promise<Array<MasaiverseV2Reply>> {
  const { replies } = await fetchJson<{ replies: Array<MasaiverseV2Reply> }>(
    `${MASAIVERSE_V2_API.discussionReplies}?postId=${encodeURIComponent(postId)}`,
  )
  return replies
}

/** Posts a reply to a discussion. */
export async function createMasaiverseV2DiscussionReply(input: {
  postId: string
  content: string
}): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(MASAIVERSE_V2_API.discussionReplies, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Clubs the current user has joined, for the sidebar "My Clubs" list. */
export async function fetchMasaiverseV2MyClubs(): Promise<
  Array<MasaiverseV2SidebarClub>
> {
  const { clubs } = await fetchJson<{ clubs: Array<MasaiverseV2SidebarClub> }>(
    MASAIVERSE_V2_API.myClubs,
  )
  return clubs
}

/** Full detail payload for a single club's page. */
export async function fetchMasaiverseV2ClubDetail(
  clubId: string,
): Promise<MasaiverseV2ClubDetail> {
  return fetchJson<MasaiverseV2ClubDetail>(
    `${MASAIVERSE_V2_API.clubDetail}?clubId=${encodeURIComponent(clubId)}`,
  )
}

/** Headline stats (active members, avg rating, projects, posts) for a club. */
export async function fetchMasaiverseV2ClubStats(
  clubId: string,
): Promise<MasaiverseV2ClubStats> {
  return fetchJson<MasaiverseV2ClubStats>(
    `${MASAIVERSE_V2_API.clubStats}?clubId=${encodeURIComponent(clubId)}`,
  )
}

/** A page of a club's leaderboard, ranked by club-scoped points. */
export async function fetchMasaiverseV2ClubLeaderboard(input: {
  clubId: string
  page: number
  perPage: number
}): Promise<ClubLeaderboardPage> {
  const params = new URLSearchParams({
    clubId: input.clubId,
    page: String(input.page),
    perPage: String(input.perPage),
  })
  return fetchJson<ClubLeaderboardPage>(
    `${MASAIVERSE_V2_API.clubLeaderboard}?${params.toString()}`,
  )
}

/**
 * The community-wide (global) leaderboard — members ranked by total all-time
 * points. Returns at most `limit` entries (server-clamped).
 */
export async function fetchMasaiverseV2GlobalLeaderboard(
  limit?: number,
): Promise<Array<GlobalLeaderboardEntry>> {
  const query = limit == null ? '' : `?limit=${encodeURIComponent(limit)}`
  const { entries } = await fetchJson<{
    entries: Array<GlobalLeaderboardEntry>
  }>(`${MASAIVERSE_V2_API.leaderboard}${query}`)
  return entries
}

/** Weekly connects + upcoming/live + past events for a club's detail page. */
export async function fetchMasaiverseV2ClubEvents(
  clubId: string,
): Promise<MasaiverseV2ClubEvents> {
  return fetchJson<MasaiverseV2ClubEvents>(
    `${MASAIVERSE_V2_API.clubEvents}?clubId=${encodeURIComponent(clubId)}`,
  )
}

/**
 * Every community event (public + club-hosted) for the events listing page.
 * The client buckets them into upcoming/past and segregates public vs club.
 */
export async function fetchMasaiverseV2Events(): Promise<
  Array<MasaiverseV2EventListItem>
> {
  const { events } = await fetchJson<{
    events: Array<MasaiverseV2EventListItem>
  }>(MASAIVERSE_V2_API.events)
  return events
}

/** Full detail payload for a single event's registration page. */
export async function fetchMasaiverseV2EventDetail(
  eventId: string,
): Promise<MasaiverseV2EventDetail> {
  return fetchJson<MasaiverseV2EventDetail>(
    `${MASAIVERSE_V2_API.eventDetail}?eventId=${encodeURIComponent(eventId)}`,
  )
}

/**
 * Registers the current user for an event and resolves with the new enrollment
 * state plus the post-registration redirect target (event link / map link).
 */
export async function enrollMasaiverseV2Event(
  eventId: string,
): Promise<EventEnrollmentState> {
  return fetchJson<EventEnrollmentState>(MASAIVERSE_V2_API.eventEnroll, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  })
}

/**
 * Submits the current user's rating (and optional feedback) for an event they
 * attended. The server allows this only once per enrollment.
 */
export async function rateMasaiverseV2Event(input: {
  eventId: string
  rating: number
  feedback?: string
}): Promise<EventRatingState> {
  return fetchJson<EventRatingState>(MASAIVERSE_V2_API.eventRate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/**
 * Records that the current member opened a club's detail page, stamping
 * `club_members.meta.lastVisitedAt`. A no-op on the server for non-members.
 */
export async function recordMasaiverseV2ClubVisit(
  clubId: string,
): Promise<{ recorded: boolean }> {
  return fetchJson<{ recorded: boolean }>(MASAIVERSE_V2_API.clubVisit, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clubId }),
  })
}

/**
 * Current admin-mode state for the signed-in user. Students resolve to
 * `{ isAdmin: false, enabled: false }`, so the client can hide the toggle.
 */
export async function fetchMasaiverseV2AdminMode(): Promise<MasaiverseV2AdminModeState> {
  return fetchJson<MasaiverseV2AdminModeState>(MASAIVERSE_V2_API.adminMode)
}

/**
 * Enables/disables admin mode for the signed-in user. Server-gated on the DB
 * role — non-admins receive a 403.
 */
export async function setMasaiverseV2AdminMode(
  enabled: boolean,
): Promise<MasaiverseV2AdminModeState> {
  return fetchJson<MasaiverseV2AdminModeState>(MASAIVERSE_V2_API.adminMode, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
}

/**
 * Creates a new draft event (admin only). The server fills it with placeholder
 * data and `meta.isPublished = false`; resolves with the new event id.
 */
export async function createMasaiverseV2Event(): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(MASAIVERSE_V2_API.eventCreate, {
    method: 'POST',
  })
}

/**
 * Creates a new draft club (admin only). The server fills it with placeholder
 * data and `meta.isPublished = false`; resolves with the new club id.
 */
export async function createMasaiverseV2Club(): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(MASAIVERSE_V2_API.clubCreate, {
    method: 'POST',
  })
}

/** Home-page banners (published only, unless the admin is in admin mode). */
export async function fetchMasaiverseV2Banners(): Promise<Array<MasaiverseV2Banner>> {
  const { banners } = await fetchJson<{ banners: Array<MasaiverseV2Banner> }>(
    MASAIVERSE_V2_API.banners,
  )
  return banners
}

/** Creates a draft banner (admin only); resolves with the new banner id. */
export async function createMasaiverseV2Banner(): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(MASAIVERSE_V2_API.bannerCreate, {
    method: 'POST',
  })
}

/** Applies an admin edit to a banner (whitelisted columns/meta keys). */
export async function updateMasaiverseV2Banner(
  bannerId: string,
  patch: MasaiverseV2EntityPatch,
): Promise<{ success: true }> {
  return fetchJson<{ success: true }>(MASAIVERSE_V2_API.bannerUpdate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bannerId, ...patch }),
  })
}

/** Permanently deletes a banner (admin only). */
export async function deleteMasaiverseV2Banner(
  bannerId: string,
): Promise<{ success: true }> {
  return fetchJson<{ success: true }>(MASAIVERSE_V2_API.bannerDelete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bannerId }),
  })
}

/** Raw editable club data (name + full meta) for the admin edit drawer. */
export type MasaiverseV2ClubEditData = {
  id: string
  name: string
  meta: Record<string, unknown>
}

export async function fetchMasaiverseV2ClubEditData(
  clubId: string,
): Promise<MasaiverseV2ClubEditData> {
  return fetchJson<MasaiverseV2ClubEditData>(
    `${MASAIVERSE_V2_API.clubEditData}?clubId=${encodeURIComponent(clubId)}`,
  )
}

/** Raw editable event data (columns + full meta) for the admin edit drawer. */
export type MasaiverseV2EventEditData = {
  id: string
  columns: {
    title: string
    description: string | null
    category: string | null
    mode: string | null
    locationTitle: string | null
    locationMapLink: string | null
    eventLink: string | null
    imageLink: string | null
    platform: string | null
    startTime: string | null
    endTime: string | null
  }
  meta: Record<string, unknown>
}

export async function fetchMasaiverseV2EventEditData(
  eventId: string,
): Promise<MasaiverseV2EventEditData> {
  return fetchJson<MasaiverseV2EventEditData>(
    `${MASAIVERSE_V2_API.eventEditData}?eventId=${encodeURIComponent(eventId)}`,
  )
}

/**
 * Uploads an image file to S3 and resolves with its public URL. Reusable for
 * any image field; the file rides in a multipart `file` field.
 */
export async function uploadMasaiverseV2Image(file: File): Promise<{ url: string }> {
  const body = new FormData()
  body.append('file', file)
  return fetchJson<{ url: string }>(MASAIVERSE_V2_API.uploadImage, {
    method: 'POST',
    body,
  })
}

/** A partial inline edit to an event/club: column and/or meta key changes. */
export type MasaiverseV2EntityPatch = {
  column?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/** Applies an admin inline edit to an event (whitelisted columns/meta keys). */
export async function updateMasaiverseV2Event(
  eventId: string,
  patch: MasaiverseV2EntityPatch,
): Promise<{ success: true }> {
  return fetchJson<{ success: true }>(MASAIVERSE_V2_API.eventUpdate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, ...patch }),
  })
}

/** Applies an admin inline edit to a club (whitelisted columns/meta keys). */
export async function updateMasaiverseV2Club(
  clubId: string,
  patch: MasaiverseV2EntityPatch,
): Promise<{ success: true }> {
  return fetchJson<{ success: true }>(MASAIVERSE_V2_API.clubUpdate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clubId, ...patch }),
  })
}

/** Joins or leaves a club and resolves with the new membership state. */
export async function setMasaiverseV2ClubMembership(input: {
  clubId: string
  join: boolean
}): Promise<ClubMembershipState> {
  return fetchJson<ClubMembershipState>(MASAIVERSE_V2_API.clubMembership, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
