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
import CalendarPanel from './CalendarPanel'
import { toDateKey } from './calendarUtils'
import type { ReactNode } from 'react'

const { fetchEvents, fetchHome, fetchLeaderboard } = vi.hoisted(() => ({
  fetchEvents: vi.fn(),
  fetchHome: vi.fn(),
  fetchLeaderboard: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Events: fetchEvents,
  fetchMasaiverseV2Home: fetchHome,
  fetchMasaiverseV2GlobalLeaderboard: fetchLeaderboard,
}))

// The day/upcoming event lists render router <Link>s; stub them in jsdom.
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

describe('CalendarPanel', () => {
  it('dots event days and lists a day’s events when it is clicked', async () => {
    // An event on the 15th of the current month (noon IST), so it lands in the
    // calendar's default (current) month grid.
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const startTime = new Date(Date.UTC(year, month, 15, 6, 30)).toISOString()

    fetchEvents.mockResolvedValue([
      {
        id: '12',
        title: 'Build Sprint',
        startTime,
        endTime: null,
        clubName: 'Code Club',
        clubId: '7',
        imageUrl: null,
        aboveTitle: null,
        belowTitle: null,
        category: null,
        mode: null,
        locationTitle: null,
        isEnrolled: false,
      },
    ])
    fetchHome.mockResolvedValue({ events: [] })
    fetchLeaderboard.mockResolvedValue([])

    renderWithClient(<CalendarPanel />)

    // The 15th is marked as having events.
    const dayButton = await waitFor(() =>
      screen.getByRole('button', { name: '15, has events' }),
    )

    // Nothing is listed until a day is clicked.
    expect(screen.queryByText('Build Sprint')).toBeNull()

    fireEvent.click(dayButton)

    expect(screen.getByText('Build Sprint')).toBeTruthy()
    expect(screen.getByText('Code Club')).toBeTruthy()
    // Sanity: the clicked key matches the current month's 15th.
    expect(toDateKey(new Date(year, month, 15)).endsWith('-15')).toBe(true)
  })

  it('renders with no events without dotting any day', async () => {
    fetchEvents.mockResolvedValue([])
    fetchHome.mockResolvedValue({ events: [] })
    fetchLeaderboard.mockResolvedValue([])

    renderWithClient(<CalendarPanel />)

    await waitFor(() => expect(screen.getByText('Upcoming events')).toBeTruthy())
    expect(screen.getByText('Global leaderboard')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /has events/ })).toBeNull()
  })
})
