import { eq, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { clubMembers } from '@/db/schema'
import { pushNotificationService } from '@/server/pushNotifications/pushNotification.service'
import { parseServerTimestamp } from '@/lib/parseServerTimestamp'

type VoteValue = 'upvote' | 'downvote'
export type DiscussionSortMode = 'hot' | 'top' | 'new'
export type DiscussionEntityId = string | number
const UTC_SQL_NOW = sql`UTC_TIMESTAMP()`

function normalizeTimestampForClient(value: string | null): string | null {
  const parsed = parseServerTimestamp(value)
  return parsed ? parsed.toISOString() : null
}

export type DiscussionReply = {
  id: DiscussionEntityId
  postId: DiscussionEntityId
  content: string
  createdAt: string | null
  authorName: string
  authorProfileImage: string | null
  upvotes: number
  downvotes: number
  myVote: VoteValue | null
}

export type DiscussionPost = {
  id: DiscussionEntityId
  content: string
  createdAt: string | null
  authorName: string
  authorProfileImage: string | null
  upvotes: number
  downvotes: number
  myVote: VoteValue | null
  isBookmarked: boolean
  replies: Array<DiscussionReply>
}

type SortablePost = DiscussionPost & {
  rankingMeta: {
    upvotes: number
    downvotes: number
    netVotes: number
    replyCount: number
    totalInteractions: number
    ageHours: number
    hoursSinceLastActivity: number
    hotScore: number
    topScore: number
  }
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0] as Array<T>
    }
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

async function getJoinedClubId(userId: number) {
  const membership = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .limit(1)

  return membership[0]?.clubId ?? null
}

function normalizePostId(postId: DiscussionEntityId): number {
  const normalized = typeof postId === 'number' ? postId : Number(postId)
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error('INVALID_POST_ID')
  }
  return normalized
}

function truncateNotificationText(text: string, maxLength = 90): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function getPlainTextFromHtml(content: string): string {
  const withoutBreakTags = content.replace(/<\s*br\s*\/?>/gi, ' ')
  const withoutTags = withoutBreakTags.replace(/<[^>]*>/g, ' ')
  const decoded = decodeBasicHtmlEntities(withoutTags)
  return decoded.replace(/\s+/g, ' ').trim()
}

export const fetchCommunityDiscussions = createServerFn({ method: 'GET' })
  .inputValidator((data?: { sortBy?: DiscussionSortMode }) => data ?? {})
  .handler(fetchCommunityDiscussionsHandler)

export async function fetchCommunityDiscussionsHandler({ data }: { data: { sortBy?: DiscussionSortMode } }) {
  const sortBy: DiscussionSortMode = data.sortBy ?? 'new'
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const currentUserRows = normalizeRows<{
    name: string | null
    profileImage: string | null
  }>(await db.execute(sql`
    SELECT
      u.name,
      COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
        JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic'))
      ) AS profileImage
    FROM users u
    LEFT JOIN (
      SELECT p.user_id AS userId, p.meta
      FROM profiles p
      INNER JOIN (
        SELECT user_id, MAX(id) AS latestProfileId
        FROM profiles
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) latestProfile ON latestProfile.latestProfileId = p.id
    ) pr ON pr.userId = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `))
  const currentUser = currentUserRows[0] ?? { name: null, profileImage: null }

  const joinedClubId = await getJoinedClubId(userId)
  if (!joinedClubId) {
    return {
      joinedClubId: null as string | null,
      currentUserName: currentUser.name,
      currentUserProfileImage: currentUser.profileImage,
      posts: [] as Array<DiscussionPost>,
    }
  }

  const postRows = normalizeRows<{
    id: DiscussionEntityId
    content: string | null
    createdAt: string | null
    authorName: string
    authorProfileImage: string | null
  }>(await db.execute(sql`
    SELECT
      p.id,
      p.content,
      p.created_at AS createdAt,
      u.name AS authorName,
      COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
        JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic'))
      ) AS authorProfileImage
    FROM posts p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN (
      SELECT p1.user_id AS userId, p1.meta
      FROM profiles p1
      INNER JOIN (
        SELECT user_id, MAX(id) AS latestProfileId
        FROM profiles
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) latestProfile ON latestProfile.latestProfileId = p1.id
    ) pr ON pr.userId = u.id
    WHERE p.club_id = ${joinedClubId}
    ORDER BY p.created_at DESC
  `))

  const replyRows = normalizeRows<{
    id: DiscussionEntityId
    postId: DiscussionEntityId
    content: string | null
    createdAt: string | null
    authorName: string
    authorProfileImage: string | null
  }>(await db.execute(sql`
    SELECT
      r.id,
      r.post_id AS postId,
      r.content,
      r.created_at AS createdAt,
      u.name AS authorName,
      COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
        JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic'))
      ) AS authorProfileImage
    FROM replies r
    INNER JOIN posts p ON p.id = r.post_id
    INNER JOIN users u ON u.id = r.user_id
    LEFT JOIN (
      SELECT p1.user_id AS userId, p1.meta
      FROM profiles p1
      INNER JOIN (
        SELECT user_id, MAX(id) AS latestProfileId
        FROM profiles
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) latestProfile ON latestProfile.latestProfileId = p1.id
    ) pr ON pr.userId = u.id
    WHERE p.club_id = ${joinedClubId}
    ORDER BY r.created_at ASC
  `))

  const postVotes = normalizeRows<{
    postId: DiscussionEntityId | null
    vote: VoteValue
    userId: number
    createdAt: string | null
  }>(await db.execute(sql`
    SELECT
      v.post_id AS postId,
      v.vote,
      v.user_id AS userId,
      v.created_at AS createdAt
    FROM votes v
    INNER JOIN posts p ON p.id = v.post_id
    WHERE p.club_id = ${joinedClubId}
  `))

  const replyVotes = normalizeRows<{
    replyId: DiscussionEntityId | null
    vote: VoteValue
    userId: number
  }>(await db.execute(sql`
    SELECT
      v.reply_id AS replyId,
      v.vote,
      v.user_id AS userId
    FROM votes v
    INNER JOIN replies r ON r.id = v.reply_id
    INNER JOIN posts p ON p.id = r.post_id
    WHERE p.club_id = ${joinedClubId}
  `))

  const bookmarkRows = normalizeRows<{
    postId: string | number
  }>(await db.execute(sql`
    SELECT
      b.post_id AS postId
    FROM club_post_bookmarks b
    INNER JOIN posts p ON p.id = b.post_id
    WHERE p.club_id = ${joinedClubId}
      AND b.user_id = ${userId}
  `))

  const postVoteMap = new Map<string, { upvotes: number; downvotes: number; myVote: VoteValue | null }>()
  for (const voteRow of postVotes) {
    const postId = voteRow.postId
    if (!postId) continue
    const postIdKey = String(postId)
    const current = postVoteMap.get(postIdKey) ?? { upvotes: 0, downvotes: 0, myVote: null }
    if (voteRow.vote === 'upvote') current.upvotes += 1
    if (voteRow.vote === 'downvote') current.downvotes += 1
    if (voteRow.userId === userId) current.myVote = voteRow.vote
    postVoteMap.set(postIdKey, current)
  }

  const replyVoteMap = new Map<string, { upvotes: number; downvotes: number; myVote: VoteValue | null }>()
  for (const voteRow of replyVotes) {
    const replyId = voteRow.replyId
    if (!replyId) continue
    const replyIdKey = String(replyId)
    const current = replyVoteMap.get(replyIdKey) ?? { upvotes: 0, downvotes: 0, myVote: null }
    if (voteRow.vote === 'upvote') current.upvotes += 1
    if (voteRow.vote === 'downvote') current.downvotes += 1
    if (voteRow.userId === userId) current.myVote = voteRow.vote
    replyVoteMap.set(replyIdKey, current)
  }

  const replyByPostId = new Map<string, Array<DiscussionReply>>()
  for (const replyRow of replyRows) {
    const voteStats = replyVoteMap.get(String(replyRow.id)) ?? {
      upvotes: 0,
      downvotes: 0,
      myVote: null,
    }
    const existing = replyByPostId.get(String(replyRow.postId)) ?? []
    existing.push({
      id: replyRow.id,
      postId: replyRow.postId,
      content: replyRow.content ?? '',
      createdAt: normalizeTimestampForClient(replyRow.createdAt ?? null),
      authorName: replyRow.authorName,
      authorProfileImage: replyRow.authorProfileImage ?? null,
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
    })
    replyByPostId.set(String(replyRow.postId), existing)
  }

  const postBookmarkMap = new Map<string, boolean>()
  for (const bookmarkRow of bookmarkRows) {
    postBookmarkMap.set(String(bookmarkRow.postId), true)
  }

  const sortedPosts: Array<SortablePost> = postRows.map((postRow) => {
    const voteStats = postVoteMap.get(String(postRow.id)) ?? {
      upvotes: 0,
      downvotes: 0,
      myVote: null,
    }
    const replies = replyByPostId.get(String(postRow.id)) ?? []
    const now = Date.now()
    const postCreatedAtMs = parseServerTimestamp(postRow.createdAt)?.getTime() ?? now
    const postAgeHours = Math.max(
      0,
      Number.isFinite(postCreatedAtMs) ? (now - postCreatedAtMs) / (1000 * 60 * 60) : 0,
    )
    const latestReplyMs = replies.reduce((latest, reply) => {
      if (!reply.createdAt) return latest
      const parsed = parseServerTimestamp(reply.createdAt)?.getTime() ?? Number.NaN
      return Number.isFinite(parsed) ? Math.max(latest, parsed) : latest
    }, Number.isFinite(postCreatedAtMs) ? postCreatedAtMs : now)
    const latestVoteMs = postVotes.reduce((latest, vote) => {
      if (String(vote.postId) !== String(postRow.id) || !vote.createdAt) return latest
      const parsed = parseServerTimestamp(vote.createdAt)?.getTime() ?? Number.NaN
      return Number.isFinite(parsed) ? Math.max(latest, parsed) : latest
    }, Number.isFinite(postCreatedAtMs) ? postCreatedAtMs : now)
    const lastActivityMs = Math.max(
      Number.isFinite(postCreatedAtMs) ? postCreatedAtMs : now,
      latestReplyMs,
      latestVoteMs,
    )
    const hoursSinceLastActivity = Math.max(0, (now - lastActivityMs) / (1000 * 60 * 60))
    const netVotes = voteStats.upvotes - voteStats.downvotes
    const replyCount = replies.length
    const totalInteractions = voteStats.upvotes + voteStats.downvotes + replyCount

    // Hot score favors high engagement while decaying with age and stale activity.
    const hotScore =
      netVotes * 3.5 +
      replyCount * 2.5 +
      Math.log10(totalInteractions + 1) * 4 -
      postAgeHours * 0.15 -
      hoursSinceLastActivity * 0.35

    // Top score emphasizes net quality, with a small reliability boost for interaction volume.
    const topScore = netVotes + Math.log10(totalInteractions + 1)

    return {
      id: postRow.id,
      content: postRow.content ?? '',
      createdAt: normalizeTimestampForClient(postRow.createdAt ?? null),
      authorName: postRow.authorName,
      authorProfileImage: postRow.authorProfileImage ?? null,
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
      isBookmarked: postBookmarkMap.get(String(postRow.id)) ?? false,
      replies,
      rankingMeta: {
        upvotes: voteStats.upvotes,
        downvotes: voteStats.downvotes,
        netVotes,
        replyCount,
        totalInteractions,
        ageHours: postAgeHours,
        hoursSinceLastActivity,
        hotScore,
        topScore,
      },
    }
  })

  sortedPosts.sort((a, b) => {
    if (sortBy === 'new') {
      const aMs = parseServerTimestamp(a.createdAt)?.getTime() ?? 0
      const bMs = parseServerTimestamp(b.createdAt)?.getTime() ?? 0
      return bMs - aMs
    }
    if (sortBy === 'top') {
      if (b.rankingMeta.topScore !== a.rankingMeta.topScore) {
        return b.rankingMeta.topScore - a.rankingMeta.topScore
      }
      return b.rankingMeta.netVotes - a.rankingMeta.netVotes
    }
    if (b.rankingMeta.hotScore !== a.rankingMeta.hotScore) {
      return b.rankingMeta.hotScore - a.rankingMeta.hotScore
    }
    return b.rankingMeta.netVotes - a.rankingMeta.netVotes
  })

  const result: Array<DiscussionPost> = sortedPosts.map(({ rankingMeta: _rankingMeta, ...post }) => post)

  return {
    joinedClubId,
    currentUserName: currentUser.name,
    currentUserProfileImage: currentUser.profileImage,
    sortBy,
    posts: result,
  }
}

export const createCommunityPost = createServerFn({ method: 'POST' })
  .inputValidator((data: { content: string }) => data)
  .handler(createCommunityPostHandler)

export async function createCommunityPostHandler({ data }: { data: { content: string } }) {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    const content = data.content.trim()
    if (!content) {
      throw new Error('POST_CONTENT_REQUIRED')
    }

    const joinedClubId = await getJoinedClubId(userId)
    if (!joinedClubId) {
      throw new Error('CLUB_ID_REQUIRED')
    }

    await db.execute(sql`
      INSERT INTO posts (club_id, user_id, content, created_at, updated_at)
      VALUES (${joinedClubId}, ${userId}, ${content}, ${UTC_SQL_NOW}, ${UTC_SQL_NOW})
    `)

    return { success: true }
  }

export const createCommunityReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: DiscussionEntityId; content: string }) => data)
  .handler(createCommunityReplyHandler)

export async function createCommunityReplyHandler({ data }: { data: { postId: DiscussionEntityId; content: string } }) {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    const content = data.content.trim()
    if (!content) {
      throw new Error('REPLY_CONTENT_REQUIRED')
    }

    const joinedClubId = await getJoinedClubId(userId)
    if (!joinedClubId) {
      throw new Error('CLUB_ID_REQUIRED')
    }

    const normalizedPostId = normalizePostId(data.postId)

    const postRows = normalizeRows<{ id: string; clubId: string; authorId: number }>(await db.execute(sql`
      SELECT id, club_id AS clubId, user_id AS authorId
      FROM posts
      WHERE id = ${normalizedPostId}
      LIMIT 1
    `))

    if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
      throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
    }

    await db.execute(sql`
      INSERT INTO replies (post_id, user_id, content, created_at, updated_at)
      VALUES (${normalizedPostId}, ${userId}, ${content}, ${UTC_SQL_NOW}, ${UTC_SQL_NOW})
    `)

    const post = postRows[0]
    if (post.authorId !== userId) {
      try {
        const actorRows = normalizeRows<{ name: string | null }>(await db.execute(sql`
          SELECT name
          FROM users
          WHERE id = ${userId}
          LIMIT 1
        `))
        const actorName = actorRows[0]?.name?.trim() || 'Someone'
        const replyTextForNotification = getPlainTextFromHtml(content)
        await pushNotificationService.sendNotificationToUser({
          userId: post.authorId,
          title: 'New reply on your post',
          body: `${actorName}: ${truncateNotificationText(replyTextForNotification)}`,
          data: {
            type: 'community_post_reply',
            postId: String(normalizedPostId),
            actorUserId: String(userId),
          },
        })
      } catch {
        // Notification failures should not block reply creation.
      }
    }

    return { success: true }
  }

async function applyPostVote(
  userId: number,
  postId: DiscussionEntityId,
  voteValue: VoteValue,
): Promise<{ postAuthorId: number; shouldNotify: boolean }> {
  const joinedClubId = await getJoinedClubId(userId)
  if (!joinedClubId) {
    throw new Error('CLUB_ID_REQUIRED')
  }

  const normalizedPostId = normalizePostId(postId)

  const postRows = normalizeRows<{ id: string; clubId: string; authorId: number }>(await db.execute(sql`
    SELECT id, club_id AS clubId, user_id AS authorId
    FROM posts
    WHERE id = ${normalizedPostId}
    LIMIT 1
  `))

  if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
    throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
  }
  const post = postRows[0]

  const existing = normalizeRows<{ id: string; vote: VoteValue }>(await db.execute(sql`
    SELECT id, vote
    FROM votes
    WHERE user_id = ${userId} AND post_id = ${normalizedPostId}
    LIMIT 1
  `))

  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO votes (user_id, post_id, vote, created_at)
      VALUES (${userId}, ${normalizedPostId}, ${voteValue}, ${UTC_SQL_NOW})
    `)
    return { postAuthorId: post.authorId, shouldNotify: true }
  }
  const existingVote = existing[0]

  if (existingVote.vote === voteValue) {
    await db.execute(sql`
      DELETE FROM votes
      WHERE id = ${existingVote.id}
    `)
    return { postAuthorId: post.authorId, shouldNotify: false }
  }

  await db.execute(sql`
    UPDATE votes
    SET vote = ${voteValue}
    WHERE id = ${existingVote.id}
  `)
  return { postAuthorId: post.authorId, shouldNotify: true }
}

async function applyReplyVote(userId: number, replyId: string, voteValue: VoteValue) {
  const joinedClubId = await getJoinedClubId(userId)
  if (!joinedClubId) {
    throw new Error('CLUB_ID_REQUIRED')
  }

  const replyRows = normalizeRows<{ id: string; postId: string; clubId: string }>(await db.execute(sql`
    SELECT r.id, r.post_id AS postId, p.club_id AS clubId
    FROM replies r
    INNER JOIN posts p ON p.id = r.post_id
    WHERE r.id = ${replyId}
    LIMIT 1
  `))

  if (replyRows.length === 0 || replyRows[0].clubId !== joinedClubId) {
    throw new Error('REPLY_NOT_FOUND_IN_JOINED_CLUB')
  }

  const existing = normalizeRows<{ id: string; vote: VoteValue }>(await db.execute(sql`
    SELECT id, vote
    FROM votes
    WHERE user_id = ${userId} AND reply_id = ${replyId}
    LIMIT 1
  `))

  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO votes (user_id, reply_id, vote, created_at)
      VALUES (${userId}, ${replyId}, ${voteValue}, ${UTC_SQL_NOW})
    `)
    return
  }
  const existingVote = existing[0]

  if (existingVote.vote === voteValue) {
    await db.execute(sql`
      DELETE FROM votes
      WHERE id = ${existingVote.id}
    `)
    return
  }

  await db.execute(sql`
    UPDATE votes
    SET vote = ${voteValue}
    WHERE id = ${existingVote.id}
  `)
}

export const voteCommunityPost = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: DiscussionEntityId; vote: VoteValue }) => data)
  .handler(voteCommunityPostHandler)

export async function voteCommunityPostHandler({ data }: { data: { postId: DiscussionEntityId; vote: VoteValue } }) {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    const voteResult = await applyPostVote(userId, data.postId, data.vote)

    if (voteResult.shouldNotify && voteResult.postAuthorId !== userId && data.vote === 'upvote') {
      try {
        const actorRows = normalizeRows<{ name: string | null }>(await db.execute(sql`
          SELECT name
          FROM users
          WHERE id = ${userId}
          LIMIT 1
        `))
        const actorName = actorRows[0]?.name?.trim() || 'Someone'

        await pushNotificationService.sendNotificationToUser({
          userId: voteResult.postAuthorId,
          title: 'Your post got an upvote',
          body: `${actorName} upvoted your post`,
          data: {
            type: 'community_post_upvote',
            postId: String(data.postId),
            actorUserId: String(userId),
            vote: data.vote,
          },
        })
      } catch {
        // Notification failures should not block vote actions.
      }
    }

    return { success: true }
  }

export const voteCommunityReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { replyId: string; vote: VoteValue }) => data)
  .handler(voteCommunityReplyHandler)

export async function voteCommunityReplyHandler({ data }: { data: { replyId: string; vote: VoteValue } }) {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    await applyReplyVote(userId, data.replyId, data.vote)
    return { success: true }
  }

export const toggleCommunityPostBookmark = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: DiscussionEntityId }) => data)
  .handler(toggleCommunityPostBookmarkHandler)

export async function toggleCommunityPostBookmarkHandler({ data }: { data: { postId: DiscussionEntityId } }) {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    const joinedClubId = await getJoinedClubId(userId)
    if (!joinedClubId) {
      throw new Error('CLUB_ID_REQUIRED')
    }

    const normalizedPostId = normalizePostId(data.postId)

    const postRows = normalizeRows<{ id: string; clubId: string }>(await db.execute(sql`
      SELECT id, club_id AS clubId
      FROM posts
      WHERE id = ${normalizedPostId}
      LIMIT 1
    `))

    if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
      throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
    }

    const existingBookmark = normalizeRows<{ id: string }>(await db.execute(sql`
      SELECT id
      FROM club_post_bookmarks
      WHERE user_id = ${userId}
        AND post_id = ${normalizedPostId}
      LIMIT 1
    `))

    if (existingBookmark.length === 0) {
      await db.execute(sql`
        INSERT INTO club_post_bookmarks (user_id, post_id, created_at)
        VALUES (${userId}, ${normalizedPostId}, ${UTC_SQL_NOW})
      `)
      return { success: true, isBookmarked: true }
    }
    const currentBookmark = existingBookmark[0]

    await db.execute(sql`
      DELETE FROM club_post_bookmarks
      WHERE id = ${currentBookmark.id}
    `)

    return { success: true, isBookmarked: false }
  }
