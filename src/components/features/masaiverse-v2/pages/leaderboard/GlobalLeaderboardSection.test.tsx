// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
    fetchLeaderboard.mockResolvedValue([])
    renderWithClient(<GlobalLeaderboardSection />)
    await waitFor(() =>
      expect(screen.getByText('No points have been earned yet.')).toBeTruthy(),
    )
  })

  it('renders ranked members with medals, initials, photos and points', async () => {
    fetchLeaderboard.mockResolvedValue([
      { rank: 1, userId: '10', name: 'Priya Rajan', avatarUrl: null, points: 940 },
      {
        rank: 2,
        userId: '20',
        name: 'Arjun Mehta',
        avatarUrl: 'https://cdn/a.png',
        points: 1200,
      },
    ])
    renderWithClient(<GlobalLeaderboardSection />)

    await waitFor(() => expect(screen.getByText('Priya Rajan')).toBeTruthy())
    // Rank 1 → gold medal; initials for the photo-less member.
    expect(screen.getByText('🥇')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    // Points carry a thousands separator and a "pts" suffix.
    expect(screen.getByText('1,200')).toBeTruthy()
    expect(screen.getAllByText('pts')).toHaveLength(2)
  })
})
