// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { LectureDiscussionListItem } from '../LectureDiscussionListItem'

const hoisted = vi.hoisted(() => ({
  invalidate: vi.fn(),
  addReply: vi.fn(),
  markRead: vi.fn(),
  pushLearnEvent: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/discussionsApi', () => ({
  addLearnDiscussionReplyViaApi: hoisted.addReply,
  markLearnDiscussionRepliesReadViaApi: hoisted.markRead,
}))
vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
}))
vi.mock('../LectureDiscussionReplyForm', () => ({
  LectureDiscussionReplyForm: () => <div data-testid="reply-form" />,
}))
vi.mock('../LectureDiscussionOwnerActions', () => ({
  LectureDiscussionOwnerActions: () => <div data-testid="owner-actions" />,
}))

function makeDiscussion(
  overrides: Partial<DiscussionListItem> = {},
): DiscussionListItem {
  return {
    id: 8,
    title: 'Question',
    messagePreview: 'body',
    isClosed: false,
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    threadCount: 0,
    unreadReplyCount: 0,
    feedbackRating: null,
    threads: [],
    author: { id: 1, name: 'Me' },
    ...overrides,
  }
}

describe('LectureDiscussionListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.invalidate.mockResolvedValue(undefined)
    hoisted.markRead.mockResolvedValue({ ok: true })
  })

  it('renders owner actions for the author', () => {
    const { container } = render(
      <LectureDiscussionListItem
        discussion={makeDiscussion()}
        currentUserId={1}
      />,
    )
    expect(within(container).getByTestId('owner-actions')).toBeTruthy()
  })

  it('hides owner actions for non-authors', () => {
    const { container } = render(
      <LectureDiscussionListItem
        discussion={makeDiscussion()}
        currentUserId={2}
      />,
    )
    expect(within(container).queryByTestId('owner-actions')).toBeNull()
  })

  it('marks replies read when the owner opens a thread with unread replies', async () => {
    const { container } = render(
      <LectureDiscussionListItem
        discussion={makeDiscussion({ unreadReplyCount: 2 })}
        currentUserId={1}
      />,
    )
    fireEvent.click(within(container).getByRole('button', { name: /repl/i }))
    await waitFor(() => {
      expect(hoisted.markRead).toHaveBeenCalledWith(8)
      expect(hoisted.invalidate).toHaveBeenCalled()
    })
  })

  it('does not mark read when there are no unread replies', () => {
    const { container } = render(
      <LectureDiscussionListItem
        discussion={makeDiscussion({ unreadReplyCount: 0 })}
        currentUserId={1}
      />,
    )
    fireEvent.click(within(container).getByRole('button', { name: /repl/i }))
    expect(hoisted.markRead).not.toHaveBeenCalled()
  })

  it('does not mark read for non-owners even with unread replies', () => {
    const { container } = render(
      <LectureDiscussionListItem
        discussion={makeDiscussion({ unreadReplyCount: 2 })}
        currentUserId={2}
      />,
    )
    fireEvent.click(within(container).getByRole('button', { name: /repl/i }))
    expect(hoisted.markRead).not.toHaveBeenCalled()
  })
})
