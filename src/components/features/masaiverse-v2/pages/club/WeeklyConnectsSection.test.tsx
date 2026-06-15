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
import WeeklyConnectsSection from './WeeklyConnectsSection'
import type { ReactNode } from 'react'

const { fetchEvents } = vi.hoisted(() => ({ fetchEvents: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubEvents: fetchEvents,
  fetchMasaiverseV2ClubStats: vi.fn(),
  fetchMasaiverseV2MyClubs: vi.fn(),
}))

// Weekly-connect rows link to the event detail page; render plain anchors so
// the section can mount its rows without a full router.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="#" className={className}>
      {children}
    </a>
  ),
}))

const NOW = new Date('2026-06-03T12:00:00Z')

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

describe('WeeklyConnectsSection', () => {
  it('shows the loading state while pending', () => {
    fetchEvents.mockReturnValue(new Promise(() => {}))
    renderWithClient(<WeeklyConnectsSection clubId="5" now={NOW} />)
    expect(screen.getByLabelText('Loading weekly connects')).toBeTruthy()
    expect(screen.getByText('Weekly Connects')).toBeTruthy()
  })

  it('opens the schedule drawer when "See schedule" is clicked', () => {
    fetchEvents.mockReturnValue(new Promise(() => {}))
    const onViewSchedule = vi.fn()
    renderWithClient(
      <WeeklyConnectsSection
        clubId="5"
        now={NOW}
        onViewSchedule={onViewSchedule}
      />,
    )
    fireEvent.click(screen.getByText('See schedule →'))
    expect(onViewSchedule).toHaveBeenCalledOnce()
  })

  it('shows the empty state when there are no weekly connects', async () => {
    fetchEvents.mockResolvedValue({ weeklyConnects: [], upcoming: [], past: [] })
    renderWithClient(<WeeklyConnectsSection clubId="5" now={NOW} />)
    await waitFor(() =>
      expect(
        screen.getByText('No weekly connects scheduled yet.'),
      ).toBeTruthy(),
    )
  })

  it('orders rows live → upcoming → completed', async () => {
    fetchEvents.mockResolvedValue({
      weeklyConnects: [
        {
          id: 'past',
          title: 'Past Talk',
          subtitle: null,
          startTime: '2026-05-01T11:00:00Z',
          endTime: '2026-05-01T13:00:00Z',
        },
        {
          id: 'live',
          title: 'Live Circle',
          subtitle: null,
          startTime: '2026-06-03T11:00:00Z',
          endTime: '2026-06-03T13:00:00Z',
        },
        {
          id: 'upcoming',
          title: 'Future Build',
          subtitle: null,
          startTime: '2026-06-10T11:00:00Z',
          endTime: '2026-06-10T13:00:00Z',
        },
      ],
      upcoming: [],
      past: [],
    })
    const { container } = renderWithClient(
      <WeeklyConnectsSection clubId="5" now={NOW} />,
    )

    await waitFor(() => expect(screen.getByText('Live Circle')).toBeTruthy())
    const text = container.textContent
    expect(text.indexOf('Live Circle')).toBeLessThan(text.indexOf('Future Build'))
    expect(text.indexOf('Future Build')).toBeLessThan(text.indexOf('Past Talk'))
  })
})
