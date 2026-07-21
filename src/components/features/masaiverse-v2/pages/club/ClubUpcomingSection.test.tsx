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
import ClubUpcomingSection from './ClubUpcomingSection'
import type { ReactNode } from 'react'

const { fetchEvents } = vi.hoisted(() => ({ fetchEvents: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubEvents: fetchEvents,
  fetchMasaiverseV2ClubStats: vi.fn(),
  fetchMasaiverseV2MyClubs: vi.fn(),
}))

// EventCard links to the detail route; stub the router Link so cards render
// without a RouterProvider.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ClubUpcomingSection', () => {
  it('renders the section header and empty state', async () => {
    fetchEvents.mockResolvedValue({
      weeklyConnects: [],
      upcoming: [],
      past: [],
    })
    renderWithClient(<ClubUpcomingSection clubId="5" />)

    expect(screen.getByText('Live & Upcoming Events')).toBeTruthy()
    await waitFor(() =>
      expect(
        screen.getByText('No live or upcoming events right now.'),
      ).toBeTruthy(),
    )
  })

  it('renders the club events with a count subtitle', async () => {
    fetchEvents.mockResolvedValue({
      weeklyConnects: [],
      upcoming: [
        {
          id: 'e1',
          imageUrl: null,
          aboveTitle: null,
          title: 'React Deep Dive',
          belowTitle: null,
          startTime: null,
          endTime: null,
        },
      ],
      past: [],
    })
    renderWithClient(<ClubUpcomingSection clubId="5" />)

    await waitFor(() =>
      expect(screen.getByText('React Deep Dive')).toBeTruthy(),
    )
    expect(screen.getByText('· 1 event')).toBeTruthy()
  })

  it('opens the calendar drawer when "View calendar" is clicked', () => {
    fetchEvents.mockReturnValue(new Promise(() => {}))
    const onViewCalendar = vi.fn()
    renderWithClient(
      <ClubUpcomingSection clubId="5" onViewCalendar={onViewCalendar} />,
    )
    fireEvent.click(screen.getByText('View calendar →'))
    expect(onViewCalendar).toHaveBeenCalledOnce()
  })
})
