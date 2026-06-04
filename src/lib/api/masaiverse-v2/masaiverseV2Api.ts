import type { MasaiverseV2HomeData } from '@/server/api/masaiverse-v2/getMasaiverseV2Home.service'
import type { CommunityDiscussionsPage } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import type { DiscussionVoteState } from '@/server/api/masaiverse-v2/services/voteCommunityDiscussion.service'
import type { MasaiverseV2Reply } from '@/server/api/masaiverse-v2/services/getDiscussionReplies.service'
import type { MasaiverseV2SidebarClub } from '@/server/api/masaiverse-v2/services/getMyClubs.service'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import type { ClubMembershipState } from '@/server/api/masaiverse-v2/services/setClubMembership.service'
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

/** A page of community discussions (paginated, newest first, optional search). */
export async function fetchMasaiverseV2Discussions(input: {
  offset: number
  limit: number
  q?: string
}): Promise<CommunityDiscussionsPage> {
  const params = new URLSearchParams({
    offset: String(input.offset),
    limit: String(input.limit),
  })
  if (input.q) params.set('q', input.q)
  return fetchJson<CommunityDiscussionsPage>(
    `${MASAIVERSE_V2_API.discussions}?${params.toString()}`,
  )
}

/** Creates a club-less community discussion post (title + rich-text content + tags). */
export async function createMasaiverseV2Discussion(input: {
  title: string
  content: string
  tags: Array<string>
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
