import { describe, expect, it } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import {
  filterDiscussions,
  paginate,
  totalPageCount,
} from '../filterAndPaginateDiscussions'

function makeDiscussion(
  overrides: Partial<DiscussionListItem> & { id: number },
): DiscussionListItem {
  return {
    id: overrides.id,
    title: overrides.title ?? `Discussion ${overrides.id}`,
    messagePreview: overrides.messagePreview ?? 'body',
    isClosed: overrides.isClosed ?? false,
    isPublic: overrides.isPublic ?? true,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00Z',
    threadCount: overrides.threadCount ?? 0,
    unreadReplyCount: overrides.unreadReplyCount ?? 0,
    feedbackRating: overrides.feedbackRating ?? null,
    threads: overrides.threads ?? [],
    author: overrides.author ?? { id: 1, name: 'Author' },
  }
}

const discussions: Array<DiscussionListItem> = [
  makeDiscussion({
    id: 1,
    title: 'React hooks',
    author: { id: 10, name: 'Ann' },
  }),
  makeDiscussion({
    id: 2,
    title: 'CSS grid',
    messagePreview: 'flexbox vs grid',
    author: { id: 20, name: 'Bob' },
  }),
  makeDiscussion({
    id: 3,
    title: 'Node streams',
    author: { id: 10, name: 'Ann' },
  }),
  makeDiscussion({ id: 4, title: 'Orphan', author: null }),
]

describe('filterDiscussions', () => {
  it('returns everything when no filters are active', () => {
    expect(
      filterDiscussions(discussions, {
        search: '   ',
        mineOnly: false,
        currentUserId: 10,
      }),
    ).toHaveLength(4)
  })

  it('keeps only the current user discussions when mineOnly is set', () => {
    const result = filterDiscussions(discussions, {
      search: '',
      mineOnly: true,
      currentUserId: 10,
    })
    expect(result.map((d) => d.id)).toEqual([1, 3])
  })

  it('excludes everything for mineOnly when currentUserId is null', () => {
    expect(
      filterDiscussions(discussions, {
        search: '',
        mineOnly: true,
        currentUserId: null,
      }),
    ).toHaveLength(0)
  })

  it('matches search against title (case-insensitive)', () => {
    const result = filterDiscussions(discussions, {
      search: 'react',
      mineOnly: false,
      currentUserId: null,
    })
    expect(result.map((d) => d.id)).toEqual([1])
  })

  it('matches search against the message preview', () => {
    const result = filterDiscussions(discussions, {
      search: 'flexbox',
      mineOnly: false,
      currentUserId: null,
    })
    expect(result.map((d) => d.id)).toEqual([2])
  })

  it('combines mineOnly and search', () => {
    const result = filterDiscussions(discussions, {
      search: 'node',
      mineOnly: true,
      currentUserId: 10,
    })
    expect(result.map((d) => d.id)).toEqual([3])
  })
})

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5]

  it('returns the requested page slice', () => {
    expect(paginate(items, 1, 2)).toEqual([1, 2])
    expect(paginate(items, 2, 2)).toEqual([3, 4])
    expect(paginate(items, 3, 2)).toEqual([5])
  })

  it('clamps a page below 1 to the first slice', () => {
    expect(paginate(items, 0, 2)).toEqual([1, 2])
  })
})

describe('totalPageCount', () => {
  it('rounds up and never returns less than 1', () => {
    expect(totalPageCount(0, 10)).toBe(1)
    expect(totalPageCount(10, 10)).toBe(1)
    expect(totalPageCount(11, 10)).toBe(2)
  })

  it('returns 1 for a non-positive page size', () => {
    expect(totalPageCount(50, 0)).toBe(1)
  })
})
