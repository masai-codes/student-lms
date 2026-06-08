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
import ClubLeaderboardSection from './ClubLeaderboardSection'
import type { ReactNode } from 'react'

const { fetchLeaderboard } = vi.hoisted(() => ({ fetchLeaderboard: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubEvents: vi.fn(),
  fetchMasaiverseV2ClubLeaderboard: fetchLeaderboard,
  fetchMasaiverseV2ClubStats: vi.fn(),
  fetchMasaiverseV2MyClubs: vi.fn(),
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const entry = (rank: number, name: string, points: number) => ({
  rank,
  userId: String(rank),
  name,
  avatarUrl: null,
  points,
  postsCount: rank,
  eventsCount: rank * 2,
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ClubLeaderboardSection', () => {
  it('shows a loading skeleton while pending', () => {
    fetchLeaderboard.mockReturnValue(new Promise(() => {}))
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    expect(screen.getByText('Club Leaderboard')).toBeTruthy()
    expect(screen.getByLabelText('Loading leaderboard')).toBeTruthy()
  })

  it('shows an error message when the request fails', async () => {
    fetchLeaderboard.mockRejectedValue(new Error('boom'))
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() =>
      expect(screen.getByText(/couldn't load the leaderboard/i)).toBeTruthy(),
    )
  })

  it('shows an empty state when no points exist', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [],
      page: 0,
      perPage: 5,
      total: 0,
      hasMore: false,
    })
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() =>
      expect(screen.getByText(/No points have been earned/i)).toBeTruthy(),
    )
  })

  it('renders ranked members without a pager on a single page', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [entry(1, 'Priya', 940), entry(2, 'Arjun', 820)],
      page: 0,
      perPage: 5,
      total: 2,
      hasMore: false,
    })
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
    expect(screen.getByText('Arjun')).toBeTruthy()
    expect(screen.queryByLabelText('Next page')).toBeNull()
  })

  it('pages forward and back through the leaderboard', async () => {
    fetchLeaderboard.mockImplementation((input: { page: number }) =>
      Promise.resolve(
        input.page === 0
          ? {
              entries: [entry(1, 'Priya', 940)],
              page: 0,
              perPage: 5,
              total: 6,
              hasMore: true,
            }
          : {
              entries: [entry(6, 'Rohit', 530)],
              page: 1,
              perPage: 5,
              total: 6,
              hasMore: false,
            },
      ),
    )
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
    expect(screen.getByText('Page 1')).toBeTruthy()
    expect(screen.getByLabelText('Previous page')).toHaveProperty(
      'disabled',
      true,
    )

    fireEvent.click(screen.getByLabelText('Next page'))

    await waitFor(() => expect(screen.getByText('Rohit')).toBeTruthy())
    expect(screen.getByText('Page 2')).toBeTruthy()
    expect(screen.getByLabelText('Next page')).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByLabelText('Previous page'))
    await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
  })
})
