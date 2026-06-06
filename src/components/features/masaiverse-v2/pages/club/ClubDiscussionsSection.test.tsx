// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubDiscussionsSection from './ClubDiscussionsSection'
import type { ReactNode } from 'react'

const { fetchDiscussions } = vi.hoisted(() => ({ fetchDiscussions: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Discussions: fetchDiscussions,
  createMasaiverseV2Discussion: vi.fn(),
  voteMasaiverseV2Discussion: vi.fn(),
  voteMasaiverseV2Reply: vi.fn(),
  fetchMasaiverseV2DiscussionReplies: vi.fn().mockResolvedValue([]),
  createMasaiverseV2DiscussionReply: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ClubDiscussionsSection', () => {
  it('renders the club-scoped discussion feed', async () => {
    fetchDiscussions.mockResolvedValue({ discussions: [], hasMore: false })
    renderWithClient(<ClubDiscussionsSection clubId="81910" discussions={[]} />)

    expect(screen.getByText('Club Discussion')).toBeTruthy()
    await waitFor(() =>
      expect(fetchDiscussions).toHaveBeenLastCalledWith({
        offset: 0,
        limit: 5,
        q: '',
        clubId: '81910',
      }),
    )
  })
})
