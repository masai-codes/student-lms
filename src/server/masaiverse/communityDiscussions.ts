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
  upvotes: number
  downvotes: number
  myVote: VoteValue | null
}

export type DiscussionPost = {
  id: string
  content: string
  createdAt: string | null
  authorName: string
  upvotes: number
  downvotes: number
  myVote: VoteValue | null
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

  const joinedClubId = await getJoinedClubId(userId)
  if (!joinedClubId) {
    return {
      joinedClubId: null as string | null,
      posts: [] as Array<DiscussionPost>,
    }
  }

  const postRows = normalizeRows<{
    id: string
    content: string | null
    createdAt: string | null
    authorName: string
  }>(await db.execute(sql`
    SELECT
      p.id,
      p.content,
      p.created_at AS createdAt,
      u.name AS authorName
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
  }>(await db.execute(sql`
    SELECT
      r.id,
      r.post_id AS postId,
      r.content,
      r.created_at AS createdAt,
      u.name AS authorName
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
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
    })
    replyByPostId.set(replyRow.postId, existing)
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
      upvotes: voteStats.upvotes,
      downvotes: voteStats.downvotes,
      myVote: voteStats.myVote,
      replies: replyByPostId.get(postRow.id) ?? [],
    }
  })

  return {
    joinedClubId,
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

    const targetPost = postRows[0] ?? null
    if (!targetPost || targetPost.clubId !== joinedClubId) {
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

  const targetPost = postRows[0] ?? null
  if (!targetPost || targetPost.clubId !== joinedClubId) {
    throw new Error('POST_NOT_FOUND_IN_JOINED_CLUB')
  }

  const existing = normalizeRows<{ id: string; vote: VoteValue }>(await db.execute(sql`
    SELECT id, vote
    FROM votes
    WHERE user_id = ${userId} AND post_id = ${postId}
    LIMIT 1
  `))

  const existingVote = existing[0] ?? null
  if (!existingVote) {
    await db.execute(sql`
      INSERT INTO votes (user_id, post_id, vote, created_at)
      VALUES (${userId}, ${postId}, ${voteValue}, NOW())
    `)
    return
  }

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

  const targetReply = replyRows[0] ?? null
  if (!targetReply || targetReply.clubId !== joinedClubId) {
    throw new Error('REPLY_NOT_FOUND_IN_JOINED_CLUB')
  }

  const existing = normalizeRows<{ id: string; vote: VoteValue }>(await db.execute(sql`
    SELECT id, vote
    FROM votes
    WHERE user_id = ${userId} AND reply_id = ${replyId}
    LIMIT 1
  `))

  const existingVote = existing[0] ?? null
  if (!existingVote) {
    await db.execute(sql`
      INSERT INTO votes (user_id, reply_id, vote, created_at)
      VALUES (${userId}, ${replyId}, ${voteValue}, NOW())
    `)
    return
  }

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
