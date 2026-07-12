// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { LectureDiscussionList } from '../LectureDiscussionList'

vi.mock('../LectureDiscussionListItem', () => ({
  LectureDiscussionListItem: ({ discussion }: { discussion: DiscussionListItem }) => (
    <div data-testid={`discussion-item-${discussion.id}`}>{discussion.title}</div>
  ),
}))

function makeDiscussion(id: number): DiscussionListItem {
  return {
    id,
    title: `Discussion ${id}`,
    messagePreview: 'body',
    isClosed: false,
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    threadCount: 0,
    unreadReplyCount: 0,
    feedbackRating: null,
    threads: [],
    author: { id: 1, name: 'Author' },
  }
}

describe('LectureDiscussionList', () => {
  it('renders the list items', () => {
    const { container } = render(
      <LectureDiscussionList
        discussions={[makeDiscussion(1), makeDiscussion(2)]}
        emptyStateNoun="lecture"
        hasActiveFilters={false}
        currentUserId={1}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-list')).toBeTruthy()
    expect(scope.getByTestId('discussion-item-1')).toBeTruthy()
    expect(scope.getByTestId('discussion-item-2')).toBeTruthy()
  })

  it('shows the default empty state when there are no filters', () => {
    const { container } = render(
      <LectureDiscussionList
        discussions={[]}
        emptyStateNoun="assignment"
        hasActiveFilters={false}
        currentUserId={1}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-empty')).toBeTruthy()
    expect(scope.getByText(/about this assignment/)).toBeTruthy()
  })

  it('shows the filtered empty state when filters are active', () => {
    const { container } = render(
      <LectureDiscussionList
        discussions={[]}
        emptyStateNoun="lecture"
        hasActiveFilters
        currentUserId={1}
      />,
    )
    expect(within(container).getByTestId('discussion-empty-filtered')).toBeTruthy()
  })
})
