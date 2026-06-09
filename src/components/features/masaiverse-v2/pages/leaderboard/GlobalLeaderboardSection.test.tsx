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
import GlobalLeaderboardSection from './GlobalLeaderboardSection'
import type { ReactNode } from 'react'

const { fetchLeaderboard } = vi.hoisted(() => ({ fetchLeaderboard: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2GlobalLeaderboard: fetchLeaderboard,
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

describe('GlobalLeaderboardSection', () => {
  it('shows a loading state while fetching', () => {
    fetchLeaderboard.mockReturnValue(new Promise(() => {}))
    renderWithClient(<GlobalLeaderboardSection />)
    expect(screen.getByText('Loading leaderboard…')).toBeTruthy()
  })

  it('shows an error message when the fetch fails', async () => {
    fetchLeaderboard.mockRejectedValue(new Error('boom'))
    renderWithClient(<GlobalLeaderboardSection />)
    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the leaderboard. Please try again."),
      ).toBeTruthy(),
    )
  })

  it('shows an empty message when nobody has points', async () => {
    fetchLeaderboard.mockResolvedValue({ entries: [], currentUser: null })
    renderWithClient(<GlobalLeaderboardSection />)
    await waitFor(() =>
      expect(screen.getByText('No points have been earned yet.')).toBeTruthy(),
    )
  })

  it('renders the top members and pins the signed-in member below them', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [
        { rank: 1, userId: '10', name: 'Priya Rajan', avatarUrl: null, points: 940 },
        {
          rank: 2,
          userId: '20',
          name: 'Arjun Mehta',
          avatarUrl: 'https://cdn/a.png',
          points: 1200,
        },
      ],
      currentUser: {
        rank: 18,
        userId: '99',
        name: 'Vidit',
        avatarUrl: null,
        points: 120,
      },
    })
    renderWithClient(<GlobalLeaderboardSection />)

    await waitFor(() => expect(screen.getByText('Priya Rajan')).toBeTruthy())
    expect(screen.getByText('🥇')).toBeTruthy()
    // Pinned current-user row is labelled and shows their own rank.
    expect(screen.getByText('Vidit')).toBeTruthy()
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.getByText('18')).toBeTruthy()
  })

  it('refetches for the "This month" period when the tab is switched', async () => {
    fetchLeaderboard.mockImplementation((input: { period: string }) =>
      Promise.resolve({
        entries: [
          {
            rank: 1,
            userId: '10',
            name: input.period === 'month' ? 'Monthly Mira' : 'Overall Olivia',
            avatarUrl: null,
            points: 100,
          },
        ],
        currentUser: null,
      }),
    )
    renderWithClient(<GlobalLeaderboardSection />)

    await waitFor(() => expect(screen.getByText('Overall Olivia')).toBeTruthy())
    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: 'This month' }))
    await waitFor(() => expect(screen.getByText('Monthly Mira')).toBeTruthy())
    expect(fetchLeaderboard).toHaveBeenLastCalledWith({
      period: 'month',
      limit: 10,
    })
  })
})
