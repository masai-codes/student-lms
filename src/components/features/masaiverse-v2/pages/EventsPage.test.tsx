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
import EventsPage from './EventsPage'
import type { ReactNode } from 'react'
import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'

const { fetchEvents } = vi.hoisted(() => ({ fetchEvents: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Events: fetchEvents,
}))

// The admin "Add an event" CTA has its own dedicated test; stub it here so this
// suite stays focused on the events listing.
vi.mock('../AdminCreateButton', () => ({ default: () => null }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

const NOW = new Date('2026-06-03T12:00:00Z')

function event(
  overrides: Partial<MasaiverseV2EventListItem>,
): MasaiverseV2EventListItem {
  return {
    id: '0',
    imageUrl: null,
    aboveTitle: null,
    title: 'Event',
    belowTitle: null,
    category: null,
    mode: 'online',
    locationTitle: null,
    clubId: null,
    clubName: null,
    startTime: null,
    endTime: null,
    isEnrolled: false,
    ...overrides,
  }
}

const DATASET: Array<MasaiverseV2EventListItem> = [
  event({ id: 'public-upcoming', title: 'React Workshop', startTime: '2026-06-10T11:00:00Z' }),
  event({
    id: 'club-upcoming',
    title: 'Club Hack',
    clubId: '7',
    clubName: 'Code Club',
    startTime: '2026-06-20T11:00:00Z',
  }),
  event({
    id: 'public-past',
    title: 'Old Talk',
    startTime: '2026-05-01T11:00:00Z',
    endTime: '2026-05-01T13:00:00Z',
  }),
  event({
    id: 'club-live',
    title: 'Live Jam',
    clubId: '8',
    clubName: 'Music Club',
    startTime: '2026-06-03T11:00:00Z',
    endTime: '2026-06-03T13:00:00Z',
  }),
]

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <EventsPage now={NOW} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EventsPage', () => {
  it('shows a loading skeleton while events are pending', () => {
    fetchEvents.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status', { name: 'Loading events' })).toBeTruthy()
  })

  it('falls back to the system clock when no `now` is provided', () => {
    fetchEvents.mockReturnValue(new Promise(() => {}))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <EventsPage />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Events' })).toBeTruthy()
  })

  it('lists upcoming events soonest-first (live ones leading)', async () => {
    fetchEvents.mockResolvedValue(DATASET)
    renderPage()

    await waitFor(() => expect(screen.getByText('Live Jam')).toBeTruthy())
    const titles = screen.getAllByRole('link').map((link) => link.textContent)
    expect(titles[0]).toContain('Live Jam')
    expect(titles[1]).toContain('React Workshop')
    expect(titles[2]).toContain('Club Hack')
    // Past events stay out of the upcoming tab.
    expect(screen.queryByText('Old Talk')).toBeNull()
  })

  it('filters to club-hosted events via the Clubs chip', async () => {
    fetchEvents.mockResolvedValue(DATASET)
    renderPage()
    await waitFor(() => expect(screen.getByText('Live Jam')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: /Clubs/ }))

    expect(screen.getByText('Club Hack')).toBeTruthy()
    expect(screen.getByText('Live Jam')).toBeTruthy()
    expect(screen.queryByText('React Workshop')).toBeNull()
  })

  it('switches to past events via the Past tab', async () => {
    fetchEvents.mockResolvedValue(DATASET)
    renderPage()
    await waitFor(() => expect(screen.getByText('Live Jam')).toBeTruthy())

    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: /Past/ }))

    await waitFor(() => expect(screen.getByText('Old Talk')).toBeTruthy())
    expect(screen.queryByText('Live Jam')).toBeNull()
  })

  it('filters events by the search box', async () => {
    fetchEvents.mockResolvedValue(DATASET)
    renderPage()
    await waitFor(() => expect(screen.getByText('React Workshop')).toBeTruthy())

    fireEvent.change(screen.getByLabelText('Search events'), {
      target: { value: 'react' },
    })

    expect(screen.getByText('React Workshop')).toBeTruthy()
    expect(screen.queryByText('Club Hack')).toBeNull()
  })

  it('shows tailored empty states per tab when there are no events', async () => {
    fetchEvents.mockResolvedValue([])
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('No upcoming events')).toBeTruthy(),
    )

    fireEvent.focus(screen.getByRole('tab', { name: /Past/ }))
    await waitFor(() => expect(screen.getByText('No past events')).toBeTruthy())
  })
})
