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
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
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
      />,
    )

    fireEvent.click(screen.getByLabelText('Upvote'))

    await waitFor(() => expect(onVoted).toHaveBeenCalled())
    expect(onVoted.mock.calls[0][0]).toEqual({ upvotes: 25, myVote: 'upvote' })
    expect(onVote.mock.calls[0][0]).toBe('upvote')
  })
})
