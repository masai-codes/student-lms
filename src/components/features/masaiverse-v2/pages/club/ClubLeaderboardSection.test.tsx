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
    fetchLeaderboard.mockResolvedValue({ entries: [], currentUser: null })
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() =>
      expect(screen.getByText(/No points have been earned/i)).toBeTruthy(),
    )
  })

  it('renders ranked members without the projects/events subtitle', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [entry(1, 'Priya', 940), entry(2, 'Arjun', 820)],
      currentUser: null,
    })
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('Priya')).toBeTruthy())
    expect(screen.getByText('Arjun')).toBeTruthy()
    expect(screen.queryByText(/projects ·/)).toBeNull()
  })

  it('pins the signed-in member when they fall outside the top list', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [entry(1, 'Priya', 940)],
      currentUser: { ...entry(7, 'Vidit', 120) },
    })
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('Vidit')).toBeTruthy())
    expect(screen.getByText('You')).toBeTruthy()
  })

  it('refetches for the "This month" period when the tab is switched', async () => {
    fetchLeaderboard.mockImplementation((input: { period: string }) =>
      Promise.resolve({
        entries: [
          entry(1, input.period === 'month' ? 'Monthly Mira' : 'Overall Olivia', 50),
        ],
        currentUser: null,
      }),
    )
    renderWithClient(<ClubLeaderboardSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('Overall Olivia')).toBeTruthy())
    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: 'This month' }))
    await waitFor(() => expect(screen.getByText('Monthly Mira')).toBeTruthy())
    expect(fetchLeaderboard).toHaveBeenLastCalledWith({
      clubId: '5',
      period: 'month',
    })
  })
})
