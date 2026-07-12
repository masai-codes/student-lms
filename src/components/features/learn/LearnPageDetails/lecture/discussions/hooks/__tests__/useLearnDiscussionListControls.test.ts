// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { useLearnDiscussionListControls } from '../useLearnDiscussionListControls'

function makeDiscussions(count: number, authorId = 1): Array<DiscussionListItem> {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Discussion ${i + 1}`,
    messagePreview: 'body',
    isClosed: false,
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    threadCount: 0,
    threads: [],
    author: { id: authorId, name: 'Author' },
  }))
}

describe('useLearnDiscussionListControls', () => {
  it('paginates with a default page size of 10', () => {
    const { result } = renderHook(() =>
      useLearnDiscussionListControls({
        discussions: makeDiscussions(25),
        currentUserId: 1,
      }),
    )

    expect(result.current.pageSize).toBe(10)
    expect(result.current.totalPages).toBe(3)
    expect(result.current.pageItems).toHaveLength(10)
    expect(result.current.totalCount).toBe(25)

    act(() => result.current.goToPage(3))
    expect(result.current.page).toBe(3)
    expect(result.current.pageItems).toHaveLength(5)
  })

  it('clamps goToPage within bounds', () => {
    const { result } = renderHook(() =>
      useLearnDiscussionListControls({
        discussions: makeDiscussions(25),
        currentUserId: 1,
      }),
    )

    act(() => result.current.goToPage(99))
    expect(result.current.page).toBe(3)
    act(() => result.current.goToPage(-5))
    expect(result.current.page).toBe(1)
  })

  it('resets to page 1 and updates flags when search changes', () => {
    const { result } = renderHook(() =>
      useLearnDiscussionListControls({
        discussions: makeDiscussions(25),
        currentUserId: 1,
      }),
    )

    act(() => result.current.goToPage(3))
    act(() => result.current.changeSearch('Discussion 1'))

    expect(result.current.page).toBe(1)
    expect(result.current.hasActiveFilters).toBe(true)
    // "Discussion 1", "Discussion 10".."Discussion 19" all contain "Discussion 1"
    expect(result.current.filteredCount).toBe(11)
  })

  it('filters to my discussions when toggled and resets the page', () => {
    const mixed = [
      ...makeDiscussions(12, 1),
      ...makeDiscussions(4, 2).map((d) => ({ ...d, id: d.id + 100 })),
    ]
    const { result } = renderHook(() =>
      useLearnDiscussionListControls({ discussions: mixed, currentUserId: 2 }),
    )

    act(() => result.current.goToPage(2))
    act(() => result.current.toggleMineOnly())

    expect(result.current.mineOnly).toBe(true)
    expect(result.current.page).toBe(1)
    expect(result.current.filteredCount).toBe(4)
    expect(result.current.totalPages).toBe(1)
  })

  it('clamps the current page when the underlying list shrinks', () => {
    const { result, rerender } = renderHook(
      ({ discussions }) =>
        useLearnDiscussionListControls({ discussions, currentUserId: 1 }),
      { initialProps: { discussions: makeDiscussions(25) } },
    )

    act(() => result.current.goToPage(3))
    expect(result.current.page).toBe(3)

    rerender({ discussions: makeDiscussions(5) })
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems).toHaveLength(5)
  })
})
