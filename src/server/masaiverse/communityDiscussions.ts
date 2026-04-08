import { eq, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { clubMembers } from '@/db/schema'

type VoteValue = 'upvote' | 'downvote'

export type DiscussionReply = {
  id: string
  postId: string
  content: string
  createdAt: string | null
  authorName: string
  authorProfileImage: string | null
  upvotes: number
  downvotes: number
  myVote: VoteValue | null
}

export type DiscussionPost = {
  id: string
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

export const fetchCommunityDiscussions = createServerFn({ method: 'GET' }).handler(async () => {
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
      JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')) AS profileImage
    FROM users u
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
    id: string
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
      JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')) AS authorProfileImage
    FROM posts p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.club_id = ${joinedClubId}
    ORDER BY p.created_at DESC
  `))

  const replyRows = normalizeRows<{
    id: string
    postId: string
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
      JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')) AS authorProfileImage
    FROM replies r
    INNER JOIN posts p ON p.id = r.post_id
    INNER JOIN users u ON u.id = r.user_id
    WHERE p.club_id = ${joinedClubId}
    ORDER BY r.created_at ASC
  `))

  const postVotes = normalizeRows<{
    postId: string | null
    vote: VoteValue
    userId: number
  }>(await db.execute(sql`
    SELECT
      v.post_id AS postId,
      v.vote,
      v.user_id AS userId
    FROM votes v
    INNER JOIN posts p ON p.id = v.post_id
    WHERE p.club_id = ${joinedClubId}
  `))

  const replyVotes = normalizeRows<{
    replyId: string | null
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
    const current = postVoteMap.get(postId) ?? { upvotes: 0, downvotes: 0, myVote: null }
    if (voteRow.vote === 'upvote') current.upvotes += 1
    if (voteRow.vote === 'downvote') current.downvotes += 1
    if (voteRow.userId === userId) current.myVote = voteRow.vote
    postVoteMap.set(postId, current)
  }

  const replyVoteMap = new Map<string, { upvotes: number; downvotes: number; myVote: VoteValue | null }>()
  for (const voteRow of replyVotes) {
    const replyId = voteRow.replyId
    if (!replyId) continue
    const current = replyVoteMap.get(replyId) ?? { upvotes: 0, downvotes: 0, myVote: null }
    if (voteRow.vote === 'upvote') current.upvotes += 1
    if (voteRow.vote === 'downvote') current.downvotes += 1
    if (voteRow.userId === userId) current.myVote = voteRow.vote
    replyVoteMap.set(replyId, current)
  }

  const replyByPostId = new Map<string, Array<DiscussionReply>>()
  for (const replyRow of replyRows) {
    const voteStats = replyVoteMap.get(replyRow.id) ?? {
      upvotes: 0,
      downvotes: 0,
      myVote: null,
    }
    const existing = replyByPostId.get(replyRow.postId) ?? []
    existing.push({
      id: replyRow.id,
      postId: replyRow.postId,
      content: replyRow.content ?? '',
      createdAt: replyRow.createdAt ?? null,
      authorName: replyRow.authorName,
      authorProfileImage: replyRow.authorProfileImage ?? null,
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
    })
    replyByPostId.set(replyRow.postId, existing)
  }

  const postBookmarkMap = new Map<string, boolean>()
  for (const bookmarkRow of bookmarkRows) {
    postBookmarkMap.set(String(bookmarkRow.postId), true)
  }

  const result: Array<DiscussionPost> = postRows.map((postRow) => {
    const voteStats = postVoteMap.get(postRow.id) ?? {
      upvotes: 0,
      downvotes: 0,
      myVote: null,
    }
    return {
      id: postRow.id,
      content: postRow.content ?? '',
      createdAt: postRow.createdAt ?? null,
      authorName: postRow.authorName,
      authorProfileImage: postRow.authorProfileImage ?? null,
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
      isBookmarked: postBookmarkMap.get(String(postRow.id)) ?? false,
      replies: replyByPostId.get(postRow.id) ?? [],
    }
  })

  return {
    joinedClubId,
    currentUserName: currentUser.name,
    currentUserProfileImage: currentUser.profileImage,
    posts: result,
  }
})

export const createCommunityPost = createServerFn({ method: 'POST' })
  .inputValidator((data: { content: string }) => data)
  .handler(async ({ data }) => {
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
      VALUES (${joinedClubId}, ${userId}, ${content}, NOW(), NOW())
    `)

    return { success: true }
  })

export const createCommunityReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: string; content: string }) => data)
  .handler(async ({ data }) => {
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

    const postRows = normalizeRows<{ id: string; clubId: string }>(await db.execute(sql`
      SELECT id, club_id AS clubId
      FROM posts
      WHERE id = ${data.postId}
      LIMIT 1
    `))

    if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
      throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
    }

    await db.execute(sql`
      INSERT INTO replies (post_id, user_id, content, created_at, updated_at)
      VALUES (${data.postId}, ${userId}, ${content}, NOW(), NOW())
    `)

    return { success: true }
  })

async function applyPostVote(userId: number, postId: string, voteValue: VoteValue) {
  const joinedClubId = await getJoinedClubId(userId)
  if (!joinedClubId) {
    throw new Error('CLUB_ID_REQUIRED')
  }

  const postRows = normalizeRows<{ id: string; clubId: string }>(await db.execute(sql`
    SELECT id, club_id AS clubId
    FROM posts
    WHERE id = ${postId}
    LIMIT 1
  `))

  if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
    throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
  }

  const existing = normalizeRows<{ id: string; vote: VoteValue }>(await db.execute(sql`
    SELECT id, vote
    FROM votes
    WHERE user_id = ${userId} AND post_id = ${postId}
    LIMIT 1
  `))

  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO votes (user_id, post_id, vote, created_at)
      VALUES (${userId}, ${postId}, ${voteValue}, NOW())
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
      VALUES (${userId}, ${replyId}, ${voteValue}, NOW())
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
  .inputValidator((data: { postId: string; vote: VoteValue }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    await applyPostVote(userId, data.postId, data.vote)
    return { success: true }
  })

export const voteCommunityReply = createServerFn({ method: 'POST' })
  .inputValidator((data: { replyId: string; vote: VoteValue }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    await applyReplyVote(userId, data.replyId, data.vote)
    return { success: true }
  })

export const toggleCommunityPostBookmark = createServerFn({ method: 'POST' })
  .inputValidator((data: { postId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    const joinedClubId = await getJoinedClubId(userId)
    if (!joinedClubId) {
      throw new Error('CLUB_ID_REQUIRED')
    }

    const postRows = normalizeRows<{ id: string; clubId: string }>(await db.execute(sql`
      SELECT id, club_id AS clubId
      FROM posts
      WHERE id = ${data.postId}
      LIMIT 1
    `))

    if (postRows.length === 0 || postRows[0].clubId !== joinedClubId) {
      throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
    }

    const existingBookmark = normalizeRows<{ id: string }>(await db.execute(sql`
      SELECT id
      FROM club_post_bookmarks
      WHERE user_id = ${userId}
        AND post_id = ${data.postId}
      LIMIT 1
    `))

    if (existingBookmark.length === 0) {
      await db.execute(sql`
        INSERT INTO club_post_bookmarks (id, user_id, post_id, created_at)
        VALUES (UUID(), ${userId}, ${data.postId}, NOW())
      `)
      return { success: true, isBookmarked: true }
    }
    const currentBookmark = existingBookmark[0]

    await db.execute(sql`
      DELETE FROM club_post_bookmarks
      WHERE id = ${currentBookmark.id}
    `)

    return { success: true, isBookmarked: false }
  })
