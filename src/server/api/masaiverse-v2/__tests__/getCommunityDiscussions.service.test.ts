import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  posts: {
    id: 'posts.id',
    title: 'posts.title',
    createdAt: 'posts.created_at',
    userId: 'posts.user_id',
    clubId: 'posts.club_id',
    isBanned: 'posts.is_banned',
  },
  replies: { postId: 'replies.post_id' },
  users: { id: 'users.id', name: 'users.name' },
  votes: {
    postId: 'votes.post_id',
    vote: 'votes.vote',
    userId: 'votes.user_id',
  },
}))

function postsChain(rows: unknown) {
  return {
    from: () => ({
      innerJoin: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({ offset: () => Promise.resolve(rows) }),
          }),
        }),
      }),
    }),
  }
}
function groupedChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ groupBy: () => Promise.resolve(rows) }) }),
  }
}
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCommunityDiscussions', () => {
  it('maps posts with author, upvote and reply counts', async () => {
    const { getCommunityDiscussions } =
      await import('../services/getCommunityDiscussions.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        postsChain([
          {
            id: 7,
            title: 'How to explain projects?',
            content: '<p>body</p><!--tags:Career,Interviews-->',
            createdAt: '2026-06-03 09:00:00',
            authorName: 'Arjun Pandey',
          },
          {
            id: 8,
            title: 'Deployed my capstone',
            content: '<p>no tags here</p>',
            createdAt: '2026-06-03 06:00:00',
            authorName: 'Sneha Rao',
          },
        ]),
      )
      .mockReturnValueOnce(groupedChain([{ postId: 7, total: 24 }]))
      .mockReturnValueOnce(
        groupedChain([
          { postId: 7, total: 14 },
          { postId: 8, total: 27 },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ postId: 7, vote: 'upvote' }]))

    await expect(getCommunityDiscussions(12)).resolves.toEqual({
      hasMore: false,
      discussions: [
        {
          id: '7',
          title: 'How to explain projects?',
          content: '<p>body</p>',
          authorName: 'Arjun Pandey',
          tags: ['Career', 'Interviews'],
          upvotes: 24,
          replyCount: 14,
          myVote: 'upvote',
          isBanned: false,
          createdAt: '2026-06-03T09:00:00.000Z',
        },
        {
          id: '8',
          title: 'Deployed my capstone',
          content: '<p>no tags here</p>',
          authorName: 'Sneha Rao',
          tags: [],
          upvotes: 0,
          replyCount: 27,
          myVote: null,
          isBanned: false,
          createdAt: '2026-06-03T06:00:00.000Z',
        },
      ],
    })
  })

  it('flags hasMore when an extra row beyond the limit is returned', async () => {
    const { getCommunityDiscussions } =
      await import('../services/getCommunityDiscussions.service')
    // limit 1 + 1 extra row signals another page exists.
    const row = (id: number) => ({
      id,
      title: `t${id}`,
      content: '<p>x</p>',
      createdAt: '2026-06-03 09:00:00',
      authorName: 'A',
    })
    hoisted.dbSelect
      .mockReturnValueOnce(postsChain([row(7), row(8)]))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(whereChain([]))

    const page = await getCommunityDiscussions(12, 0, 1)
    expect(page.hasMore).toBe(true)
    expect(page.discussions).toHaveLength(1)
  })

  it('applies a multi-term search and returns matches', async () => {
    const { getCommunityDiscussions } =
      await import('../services/getCommunityDiscussions.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        postsChain([
          {
            id: 7,
            title: 'React interview tips',
            content: '<p>x</p><!--tags:React-->',
            createdAt: '2026-06-03 09:00:00',
            authorName: 'A',
          },
        ]),
      )
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(whereChain([]))

    // Wildcards in the query are escaped; multiple terms are AND-ed.
    const page = await getCommunityDiscussions(12, 0, 5, 'react 50%')
    expect(page.discussions).toHaveLength(1)
    expect(page.discussions[0].title).toBe('React interview tips')
  })

  it('scopes the feed to a club when a clubId is given', async () => {
    const { getCommunityDiscussions } =
      await import('../services/getCommunityDiscussions.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        postsChain([
          {
            id: 7,
            title: 'Club-only post',
            content: '<p>x</p>',
            createdAt: '2026-06-03 09:00:00',
            authorName: 'A',
          },
        ]),
      )
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(groupedChain([]))
      .mockReturnValueOnce(whereChain([]))

    const page = await getCommunityDiscussions(12, 0, 5, '', '81910')
    expect(page.discussions).toHaveLength(1)
    expect(page.discussions[0].title).toBe('Club-only post')
  })

  it('returns an empty list (and skips count queries) when no posts', async () => {
    const { getCommunityDiscussions } =
      await import('../services/getCommunityDiscussions.service')
    hoisted.dbSelect.mockReturnValueOnce(postsChain([]))

    await expect(getCommunityDiscussions(12)).resolves.toEqual({
      discussions: [],
      hasMore: false,
    })
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })
})
