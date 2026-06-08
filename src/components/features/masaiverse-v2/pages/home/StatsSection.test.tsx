// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StatsSection from './StatsSection'
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

describe('StatsSection', () => {
  it('renders the four labelled stat cards', () => {
    fetchHome.mockReturnValue(new Promise(() => {})) // never resolves: loading
    renderWithClient(<StatsSection />)

    expect(screen.getByText('learners in community')).toBeTruthy()
    expect(screen.getByText('discussions this week')).toBeTruthy()
    expect(screen.getByText('events this year')).toBeTruthy()
    expect(screen.getByText('event registrations')).toBeTruthy()
  })

  it('shows formatted counts from the API on success', async () => {
    fetchHome.mockResolvedValue({
      stats: {
        learnersInCommunity: 2841,
        discussionsThisWeek: 38,
        eventsThisYear: 6,
        eventRegistrationsThisYear: 124,
      },
    })
    renderWithClient(<StatsSection />)

    await waitFor(() => expect(screen.getByText('2,841')).toBeTruthy())
    expect(screen.getByText('38')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    expect(screen.getByText('124')).toBeTruthy()
  })

  it('falls back to a dash for every card when the request fails', async () => {
    fetchHome.mockRejectedValue(new Error('boom'))
    renderWithClient(<StatsSection />)

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(4))
  })
})
