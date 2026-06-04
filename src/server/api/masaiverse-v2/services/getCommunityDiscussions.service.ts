import { and, count, desc, eq, inArray, isNull, like, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '@/db'
import { posts, replies, users, votes } from '@/db/schema'
import { parseContentWithTags } from '@/lib/discussionTags'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

/** Max search terms honored, to bound the query. */
const MAX_SEARCH_TERMS = 6

/**
 * Builds an AND-of-terms filter where each term must appear in the title or
 * content. Tags live inside the content marker, so content matching also
 * covers tag search. LIKE wildcards in user input are escaped.
 */
function buildSearchCondition(search: string): SQL | undefined {
  const terms = search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_TERMS)
  if (terms.length === 0) return undefined

  return and(
    ...terms.map((term) => {
      const escaped = term.replace(/[%_\\]/g, '\\$&')
      return or(
        like(posts.title, `%${escaped}%`),
        like(posts.content, `%${escaped}%`),
      )
    }),
  )
}

export type DiscussionVote = 'upvote' | 'downvote'

export interface MasaiverseV2Discussion {
  id: string
  title: string
  authorName: string
  /** Tags extracted from the stored content marker. */
  tags: Array<string>
  /** Number of upvotes on the post. */
  upvotes: number
  replyCount: number
  /** The signed-in user's vote on this post, or null. */
  myVote: DiscussionVote | null
  /** UTC ISO so the client can render relative time in IST. */
  createdAt: string | null
}

export interface CommunityDiscussionsPage {
  discussions: Array<MasaiverseV2Discussion>
  /** True when more discussions exist beyond this page. */
  hasMore: boolean
}

function toUtcIso(value: string | null): string | null {
  return parseMasaiverseEventDbTimestamp(value)?.toISOString() ?? null
}

/**
 * A page of community discussions — posts with no club (`club_id IS NULL`),
 * newest first, with author, tags, upvote/reply counts and the signed-in
 * user's vote. Banned posts are excluded.
 */
export async function getCommunityDiscussions(
  userId: number,
  offset = 0,
  limit = 5,
  search = '',
): Promise<CommunityDiscussionsPage> {
  // Fetch one extra row to detect whether another page exists.
  const postRows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: users.name,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(
      and(
        isNull(posts.clubId),
        eq(posts.isBanned, 0),
        buildSearchCondition(search),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1)
    .offset(offset)

  const hasMore = postRows.length > limit
  const pageRows = hasMore ? postRows.slice(0, limit) : postRows
  if (pageRows.length === 0) return { discussions: [], hasMore: false }

  const postIds = pageRows.map((post) => post.id)

  const upvoteRows = await db
    .select({ postId: votes.postId, total: count() })
    .from(votes)
    .where(and(inArray(votes.postId, postIds), eq(votes.vote, 'upvote')))
    .groupBy(votes.postId)
  const upvotesByPost = new Map(upvoteRows.map((row) => [row.postId, row.total]))

  const replyRows = await db
    .select({ postId: replies.postId, total: count() })
    .from(replies)
    .where(inArray(replies.postId, postIds))
    .groupBy(replies.postId)
  const repliesByPost = new Map(replyRows.map((row) => [row.postId, row.total]))

  const myVoteRows = await db
    .select({ postId: votes.postId, vote: votes.vote })
    .from(votes)
    .where(and(eq(votes.userId, userId), inArray(votes.postId, postIds)))
  const myVoteByPost = new Map(myVoteRows.map((row) => [row.postId, row.vote]))

  const discussions = pageRows.map((post) => ({
    id: String(post.id),
    title: post.title ?? '',
    authorName: post.authorName,
    tags: parseContentWithTags(post.content ?? '').tags,
    upvotes: upvotesByPost.get(post.id) ?? 0,
    replyCount: repliesByPost.get(post.id) ?? 0,
    myVote: myVoteByPost.get(post.id) ?? null,
    createdAt: toUtcIso(post.createdAt),
  }))

  return { discussions, hasMore }
}
