// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DiscussionListItem } from '@/server/learn/types'
import { LectureDiscussionOwnerActions } from '../LectureDiscussionOwnerActions'

const hoisted = vi.hoisted(() => ({
  invalidate: vi.fn(),
  setClosed: vi.fn(),
  submitFeedback: vi.fn(),
  pushLearnEvent: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/discussionsApi', () => ({
  setLearnDiscussionClosedViaApi: hoisted.setClosed,
  submitLearnDiscussionFeedbackViaApi: hoisted.submitFeedback,
}))
vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
}))

function makeDiscussion(overrides: Partial<DiscussionListItem> = {}): DiscussionListItem {
  return {
    id: 3,
    title: 'T',
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

describe('LectureDiscussionOwnerActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.invalidate.mockResolvedValue(undefined)
    hoisted.setClosed.mockResolvedValue({ isClosed: true })
    hoisted.submitFeedback.mockResolvedValue({ rating: 4 })
  })

  it('resolves an open discussion and refreshes', async () => {
    const { container } = render(
      <LectureDiscussionOwnerActions discussion={makeDiscussion({ isClosed: false })} />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-close-toggle').textContent).toContain(
      'Mark as resolved',
    )

    fireEvent.click(scope.getByTestId('discussion-close-toggle'))

    await waitFor(() => {
      expect(hoisted.setClosed).toHaveBeenCalledWith({ discussionId: 3, isClosed: true })
      expect(hoisted.invalidate).toHaveBeenCalled()
    })
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_discussion_close_toggle_id_3',
      { discussion_id: 3, is_closed: true },
    )
  })

  it('offers reopen and a feedback form on a closed, unrated discussion', () => {
    const { container } = render(
      <LectureDiscussionOwnerActions
        discussion={makeDiscussion({ isClosed: true, feedbackRating: null })}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-close-toggle').textContent).toContain(
      'Reopen discussion',
    )
    expect(scope.getByTestId('discussion-feedback-form')).toBeTruthy()
  })

  it('submits feedback from the form', async () => {
    const { container } = render(
      <LectureDiscussionOwnerActions
        discussion={makeDiscussion({ isClosed: true, feedbackRating: null })}
      />,
    )
    const scope = within(container)
    fireEvent.click(scope.getByTestId('discussion-feedback-star-5'))
    fireEvent.click(scope.getByTestId('discussion-feedback-submit'))

    await waitFor(() => {
      expect(hoisted.submitFeedback).toHaveBeenCalledWith({
        discussionId: 3,
        rating: 5,
        comment: undefined,
      })
    })
  })

  it('shows the existing rating instead of the form when already rated', () => {
    const { container } = render(
      <LectureDiscussionOwnerActions
        discussion={makeDiscussion({ isClosed: true, feedbackRating: 4 })}
      />,
    )
    const scope = within(container)
    expect(scope.getByTestId('discussion-feedback-summary').textContent).toContain(
      'You rated this 4/5',
    )
    expect(scope.queryByTestId('discussion-feedback-form')).toBeNull()
  })

  it('surfaces an error when the mutation fails', async () => {
    hoisted.setClosed.mockRejectedValueOnce(new Error('DISCUSSION_FORBIDDEN'))
    const { container } = render(
      <LectureDiscussionOwnerActions discussion={makeDiscussion({ isClosed: false })} />,
    )
    const scope = within(container)
    fireEvent.click(scope.getByTestId('discussion-close-toggle'))
    await waitFor(() => {
      expect(scope.getByRole('alert').textContent).toContain('Something went wrong')
    })
  })
})
