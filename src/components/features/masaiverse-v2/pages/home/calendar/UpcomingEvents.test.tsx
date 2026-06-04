// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import UpcomingEvents from './UpcomingEvents'
import type { ReactNode } from 'react'

const { fetchHome } = vi.hoisted(() => ({ fetchHome: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Home: fetchHome,
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

describe('UpcomingEvents', () => {
  it('shows a loading state while fetching', () => {
    fetchHome.mockReturnValue(new Promise(() => {}))
    renderWithClient(<UpcomingEvents />)
    expect(screen.getByText('Loading upcoming events…')).toBeTruthy()
  })

  it('shows an empty message when there are no events', async () => {
    fetchHome.mockResolvedValue({ events: [] })
    renderWithClient(<UpcomingEvents />)
    await waitFor(() =>
      expect(
        screen.getByText('No live or upcoming events right now.'),
      ).toBeTruthy(),
    )
  })

  it('renders rows with date, title, subtitle and the right CTA', async () => {
    fetchHome.mockResolvedValue({
      events: [
        // Future, not enrolled → RSVP; has a subtitle.
        {
          id: '1',
          title: 'AI Agents Workshop',
          belowTitle: 'hands-on',
          startTime: '2099-06-20T10:00:00Z',
          endTime: null,
          isEnrolled: false,
        },
        // Enrolled → Going.
        {
          id: '2',
          title: 'Design Jam',
          belowTitle: null,
          startTime: '2099-06-21T10:00:00Z',
          endTime: null,
          isEnrolled: true,
        },
        // Currently live → Join.
        {
          id: '3',
          title: 'Live Standup',
          belowTitle: null,
          startTime: '2000-01-01T00:00:00Z',
          endTime: '2099-01-01T00:00:00Z',
          isEnrolled: false,
        },
        // No start time → date box falls back to a dash.
        {
          id: '4',
          title: 'Unscheduled Mixer',
          belowTitle: null,
          startTime: null,
          endTime: null,
          isEnrolled: false,
        },
      ],
    })
    renderWithClient(<UpcomingEvents />)

    await waitFor(() =>
      expect(screen.getByText('AI Agents Workshop')).toBeTruthy(),
    )
    expect(screen.getByText('hands-on')).toBeTruthy()
    expect(screen.getByText('Going')).toBeTruthy()
    expect(screen.getByText('Join')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
    // The future + unscheduled rows both show an RSVP chip.
    expect(screen.getAllByText('RSVP')).toHaveLength(2)
    // The June 20 start renders as day 20.
    expect(screen.getByText('20')).toBeTruthy()
  })
})
