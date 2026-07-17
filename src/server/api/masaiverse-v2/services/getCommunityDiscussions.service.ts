import { and, count, desc, eq, inArray, isNull, like, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '@/db'
import { posts, replies, users, votes } from '@/db/schema'
import { parseContentWithTags } from '@/lib/discussionTags'
import { parseMasaiverseEventDbTimestamp } from '@/utils/timeZoneHandler'

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
  /** Rich-text HTML body (with the tags marker stripped out). */
  content: string
  authorName: string
  /** Tags extracted from the stored content marker. */
  tags: Array<string>
  /** Number of upvotes on the post. */
  upvotes: number
  replyCount: number
  /** The signed-in user's vote on this post, or null. */
  myVote: DiscussionVote | null
  /**
   * Whether an admin has banned this post. Only ever `true` for admins viewing
   * in admin mode — banned posts are filtered out for everyone else.
   */
  isBanned: boolean
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
 * A page of discussions, newest first, with author, tags, upvote/reply counts
 * and the signed-in user's vote. Banned posts are excluded unless `canSeeBanned`
 * is set (admins in admin mode), in which case they are returned flagged as
 * `isBanned` so the UI can mark them.
 *
 * When `clubId` is null the result is the club-less community feed
 * (`club_id IS NULL`); when a `clubId` is given it is scoped to that club's
 * posts (`club_id = clubId`).
 */
export async function getCommunityDiscussions(
  userId: number,
  offset = 0,
  limit = 5,
  search = '',
  clubId: string | null = null,
  canSeeBanned = false,
): Promise<CommunityDiscussionsPage> {
  const clubScope =
    clubId === null ? isNull(posts.clubId) : eq(posts.clubId, Number(clubId))
  // Banned posts stay hidden for students (and admins outside admin mode); only
  // admins in admin mode see them, so they can review/unban.
  const banScope = canSeeBanned ? undefined : eq(posts.isBanned, 0)
  // Fetch one extra row to detect whether another page exists.
  const postRows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      isBanned: posts.isBanned,
      authorName: users.name,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(and(clubScope, banScope, buildSearchCondition(search)))
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
  const upvotesByPost = new Map(
    upvoteRows.map((row) => [row.postId, row.total]),
  )

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

  const discussions = pageRows.map((post) => {
    const { content, tags } = parseContentWithTags(post.content ?? '')
    return {
      id: String(post.id),
      title: post.title ?? '',
      content,
      authorName: post.authorName,
      tags,
      upvotes: upvotesByPost.get(post.id) ?? 0,
      replyCount: repliesByPost.get(post.id) ?? 0,
      myVote: myVoteByPost.get(post.id) ?? null,
      isBanned: post.isBanned === 1,
      createdAt: toUtcIso(post.createdAt),
    }
  })

  return { discussions, hasMore }
}
