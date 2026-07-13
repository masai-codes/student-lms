// @vitest-environment jsdom
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { DiscussionSummaryCard } from '../DiscussionSummaryCard'

function makeDiscussion(overrides: Partial<DiscussionListItem> = {}): DiscussionListItem {
  return {
    id: 1,
    title: 'How do React hooks work?',
    messagePreview: 'A short preview of the body',
    isClosed: false,
    isPublic: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    threadCount: 2,
    unreadReplyCount: 0,
    feedbackRating: null,
    threads: [],
    author: { id: 5, name: 'Ada' },
    ...overrides,
  }
}

describe('DiscussionSummaryCard', () => {
  it('shows an Ongoing tag for an open discussion', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ isClosed: false })} />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-status-ongoing').textContent).toBe('Ongoing')
    expect(scope.queryByTestId('discussion-status-closed')).toBeNull()
  })

  it('shows a Closed tag for a closed discussion', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ isClosed: true })} />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-status-closed').textContent).toBe('Closed')
    expect(scope.queryByTestId('discussion-status-ongoing')).toBeNull()
  })

  it('falls back to "Student" when the author is missing', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ author: null })} />,
    )
    expect(within(container).getByText('Student')).toBeTruthy()
  })

  it('renders the singular reply label for a single reply', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ threadCount: 1 })} />,
    )
    expect(within(container).getByText(/1 reply/)).toBeTruthy()
  })

  it('shows the unread badge when there are unread replies', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ unreadReplyCount: 3 })} />,
    )
    expect(within(container).getByTestId('discussion-unread-badge').textContent).toBe(
      '3 new',
    )
  })

  it('hides the unread badge when there are no unread replies', () => {
    const { container } = render(
      <DiscussionSummaryCard discussion={makeDiscussion({ unreadReplyCount: 0 })} />,
    )
    expect(within(container).queryByTestId('discussion-unread-badge')).toBeNull()
  })
})
