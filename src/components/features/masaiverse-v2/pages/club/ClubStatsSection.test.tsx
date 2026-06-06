// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubStatsSection from './ClubStatsSection'
import type { ReactNode } from 'react'

const { fetchStats } = vi.hoisted(() => ({ fetchStats: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubStats: fetchStats,
  fetchMasaiverseV2MyClubs: vi.fn(),
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

describe('ClubStatsSection', () => {
  it('renders the four labelled stat cards', () => {
    fetchStats.mockReturnValue(new Promise(() => {})) // never resolves: loading
    renderWithClient(<ClubStatsSection clubId="5" />)

    expect(screen.getByText('Active Members')).toBeTruthy()
    expect(screen.getByText('Avg event rating')).toBeTruthy()
    expect(screen.getByText('Projects built')).toBeTruthy()
    expect(screen.getByText('Community posts')).toBeTruthy()
  })

  it('shows formatted values, with one decimal for the rating', async () => {
    fetchStats.mockResolvedValue({
      activeMembers: 1234,
      avgEventRating: 4.8,
      projectsBuilt: 91,
      communityPosts: 61,
    })
    renderWithClient(<ClubStatsSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('1,234')).toBeTruthy())
    expect(screen.getByText('4.8')).toBeTruthy()
    expect(screen.getByText('91')).toBeTruthy()
    expect(screen.getByText('61')).toBeTruthy()
  })

  it('shows a dash for a null rating', async () => {
    fetchStats.mockResolvedValue({
      activeMembers: 0,
      avgEventRating: null,
      projectsBuilt: 0,
      communityPosts: 0,
    })
    renderWithClient(<ClubStatsSection clubId="5" />)

    await waitFor(() => expect(screen.getByText('—')).toBeTruthy())
  })

  it('falls back to a dash for every card when the request fails', async () => {
    fetchStats.mockRejectedValue(new Error('boom'))
    renderWithClient(<ClubStatsSection clubId="5" />)

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(4))
  })
})
