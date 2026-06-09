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
import GlobalLeaders from './GlobalLeaders'
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

describe('GlobalLeaders', () => {
  it('shows a loading state while fetching', () => {
    fetchLeaderboard.mockReturnValue(new Promise(() => {}))
    renderWithClient(<GlobalLeaders />)
    expect(screen.getByText('Loading leaderboard…')).toBeTruthy()
  })

  it('shows an empty message when nobody has points', async () => {
    fetchLeaderboard.mockResolvedValue({ entries: [], currentUser: null })
    renderWithClient(<GlobalLeaders />)
    await waitFor(() =>
      expect(screen.getByText('No points earned yet.')).toBeTruthy(),
    )
  })

  it('renders ranked leaders with medals, initials and a photo', async () => {
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
      currentUser: null,
    })
    renderWithClient(<GlobalLeaders />)

    await waitFor(() => expect(screen.getByText('Priya Rajan')).toBeTruthy())
    // Rank 1 → gold medal; initials for the photo-less leader.
    expect(screen.getByText('🥇')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    // Points are formatted with a thousands separator.
    expect(screen.getByText('1,200')).toBeTruthy()
    // The leader with a photo renders an avatar image.
    expect(screen.getByAltText('Arjun Mehta')).toBeTruthy()
  })

  it('pins the signed-in member when they fall outside the top list', async () => {
    fetchLeaderboard.mockResolvedValue({
      entries: [
        { rank: 1, userId: '10', name: 'Priya Rajan', avatarUrl: null, points: 940 },
      ],
      currentUser: {
        rank: 27,
        userId: '99',
        name: 'Vidit',
        avatarUrl: null,
        points: 30,
      },
    })
    renderWithClient(<GlobalLeaders />)

    await waitFor(() => expect(screen.getByText('Vidit')).toBeTruthy())
    expect(screen.getByText('You')).toBeTruthy()
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
    renderWithClient(<GlobalLeaders />)

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
