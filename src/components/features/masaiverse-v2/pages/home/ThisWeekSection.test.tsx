// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ThisWeekSection from './ThisWeekSection'
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

const baseEvent = {
  id: '12',
  imageUrl: null,
  aboveTitle: 'WEEKLY HACKATHON',
  title: 'Build Sprint #12',
  belowTitle: '48 teams',
  startTime: '2026-06-10T03:00:00Z',
  endTime: '2026-06-10T05:00:00Z',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ThisWeekSection', () => {
  it('shows a loading message while fetching', () => {
    fetchHome.mockReturnValue(new Promise(() => {}))
    renderWithClient(<ThisWeekSection onViewCalendar={() => {}} />)
    expect(screen.getByText('Loading events…')).toBeTruthy()
  })

  it('renders event cards and a count once loaded', async () => {
    fetchHome.mockResolvedValue({ stats: {}, events: [baseEvent] })
    renderWithClient(<ThisWeekSection onViewCalendar={() => {}} />)

    await waitFor(() => expect(screen.getByText('Build Sprint #12')).toBeTruthy())
    expect(screen.getByText('· 1 event live or upcoming')).toBeTruthy()
  })

  it('shows an empty state when there are no events', async () => {
    fetchHome.mockResolvedValue({ stats: {}, events: [] })
    renderWithClient(<ThisWeekSection onViewCalendar={() => {}} />)

    await waitFor(() =>
      expect(
        screen.getByText('No live or upcoming events right now.'),
      ).toBeTruthy(),
    )
  })
})
