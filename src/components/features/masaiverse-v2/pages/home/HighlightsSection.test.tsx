// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HighlightsSection from './HighlightsSection'
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

const highlight = {
  id: '11',
  aboveTitle: 'WEEKLY HACKATHON · RESULTS',
  title: 'Build Sprint #11 — Winners',
  belowTitle: '43 submissions',
  pastEventEmojiValue: '⚡',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('HighlightsSection', () => {
  it('shows a loading message while fetching', () => {
    fetchHome.mockReturnValue(new Promise(() => {}))
    renderWithClient(<HighlightsSection />)
    expect(screen.getByText('Loading past events…')).toBeTruthy()
  })

  it('renders recap cards once loaded', async () => {
    fetchHome.mockResolvedValue({ stats: {}, events: [], highlights: [highlight] })
    renderWithClient(<HighlightsSection />)

    await waitFor(() =>
      expect(screen.getByText('Build Sprint #11 — Winners')).toBeTruthy(),
    )
    expect(screen.getByText('⚡')).toBeTruthy()
    // A single highlight needs no carousel navigation.
    expect(screen.queryByLabelText('Next highlights')).toBeNull()
  })

  it('shows carousel navigation when there is more than one highlight', async () => {
    fetchHome.mockResolvedValue({
      stats: {},
      events: [],
      highlights: [highlight, { ...highlight, id: '12', title: 'Demo Day' }],
    })
    renderWithClient(<HighlightsSection />)

    await waitFor(() => expect(screen.getByText('Demo Day')).toBeTruthy())
    expect(screen.getByLabelText('Previous highlights')).toBeTruthy()
    expect(screen.getByLabelText('Next highlights')).toBeTruthy()
  })

  it('shows an empty state when there are no past events', async () => {
    fetchHome.mockResolvedValue({ stats: {}, events: [], highlights: [] })
    renderWithClient(<HighlightsSection />)

    await waitFor(() =>
      expect(screen.getByText('No past events yet.')).toBeTruthy(),
    )
  })
})
