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
import DiscussionReplies from './DiscussionReplies'
import type { ReactNode } from 'react'

const { listReplies, createReply, voteReply } = vi.hoisted(() => ({
  listReplies: vi.fn(),
  createReply: vi.fn(),
  voteReply: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2DiscussionReplies: listReplies,
  createMasaiverseV2DiscussionReply: createReply,
  voteMasaiverseV2Reply: voteReply,
  banMasaiverseV2Reply: vi.fn(),
  fetchMasaiverseV2AdminMode: vi
    .fn()
    .mockResolvedValue({ isAdmin: false, enabled: false }),
}))

function renderWith(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DiscussionReplies', () => {
  it('renders fetched replies', async () => {
    listReplies.mockResolvedValue([
      {
        id: '3',
        authorName: 'Sneha Rao',
        content: 'Great question!',
        upvotes: 2,
        myVote: null,
        createdAt: '2026-06-03T09:30:00.000Z',
      },
    ])
    renderWith(<DiscussionReplies postId="7" />)

    await waitFor(() =>
      expect(screen.getByText('Great question!')).toBeTruthy(),
    )
    expect(screen.getByText('Sneha Rao')).toBeTruthy()
    // Reply has its own vote control showing the upvote count.
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByLabelText('Upvote')).toBeTruthy()
  })

  it('posts a reply and clears the box', async () => {
    listReplies.mockResolvedValue([])
    createReply.mockResolvedValueOnce({ id: '9' })
    renderWith(<DiscussionReplies postId="7" />)

    const box = screen.getByPlaceholderText('Write a reply…')
    fireEvent.change(box, { target: { value: 'My reply' } })
    fireEvent.click(screen.getByText('Reply'))

    await waitFor(() => expect(createReply).toHaveBeenCalled())
    expect(createReply.mock.calls[0][0]).toEqual({
      postId: '7',
      content: 'My reply',
    })
    await waitFor(() => expect((box as HTMLTextAreaElement).value).toBe(''))
  })
})
