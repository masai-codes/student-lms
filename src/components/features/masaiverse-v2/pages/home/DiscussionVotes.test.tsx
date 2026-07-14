// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DiscussionVotes from './DiscussionVotes'
import type { ReactNode } from 'react'

function renderWith(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return { ...view, client }
}

afterEach(cleanup)

describe('DiscussionVotes', () => {
  it('shows only the upvote count with both buttons', () => {
    renderWith(
      <DiscussionVotes
        upvotes={24}
        myVote={null}
        onVote={vi.fn()}
        onVoted={vi.fn()}
        target="post"
        targetId="post-1"
      />,
    )
    expect(screen.getByText('24')).toBeTruthy()
    expect(screen.getByLabelText('Upvote')).toBeTruthy()
    expect(screen.getByLabelText('Downvote')).toBeTruthy()
  })

  it('casts a vote and forwards the new state to onVoted', async () => {
    const onVote = vi.fn().mockResolvedValue({ upvotes: 25, myVote: 'upvote' })
    const onVoted = vi.fn()
    renderWith(
      <DiscussionVotes
        upvotes={24}
        myVote={null}
        onVote={onVote}
        onVoted={onVoted}
        target="post"
        targetId="post-1"
      />,
    )

    fireEvent.click(screen.getByLabelText('Upvote'))

    await waitFor(() => expect(onVoted).toHaveBeenCalled())
    expect(onVoted.mock.calls[0][0]).toEqual({ upvotes: 25, myVote: 'upvote' })
    expect(onVote.mock.calls[0][0]).toBe('upvote')
  })

  it('invalidates the leaderboard after a successful vote', async () => {
    const onVote = vi.fn().mockResolvedValue({ upvotes: 25, myVote: 'upvote' })
    const { client } = renderWith(
      <DiscussionVotes
        upvotes={24}
        myVote={null}
        onVote={onVote}
        onVoted={vi.fn()}
        target="reply"
        targetId="reply-1"
      />,
    )
    const leaderboardKey = [
      'masaiverse-v2',
      'global-leaderboard',
      'overall',
      10,
    ]
    client.setQueryData(leaderboardKey, [])

    fireEvent.click(screen.getByLabelText('Upvote'))

    await waitFor(() =>
      expect(
        client.getQueryCache().find({ queryKey: leaderboardKey })?.state
          .isInvalidated,
      ).toBe(true),
    )
  })
})
