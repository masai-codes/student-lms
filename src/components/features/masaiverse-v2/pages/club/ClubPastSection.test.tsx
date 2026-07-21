// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubPastSection from './ClubPastSection'
import type { ReactNode } from 'react'

const { fetchEvents } = vi.hoisted(() => ({ fetchEvents: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2ClubDetail: vi.fn(),
  fetchMasaiverseV2ClubEvents: fetchEvents,
  fetchMasaiverseV2ClubStats: vi.fn(),
  fetchMasaiverseV2MyClubs: vi.fn(),
}))

// ClubPastSection renders HighlightsCarousel, whose cards use a router <Link>
// inside a Swiper; both need stubbing in jsdom.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('swiper/modules', () => ({ Navigation: {} }))

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

describe('ClubPastSection', () => {
  it('renders the section header and empty state', async () => {
    fetchEvents.mockResolvedValue({
      weeklyConnects: [],
      upcoming: [],
      past: [],
    })
    renderWithClient(<ClubPastSection clubId="5" />)

    expect(screen.getByText('Past Events')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByText('No past events yet.')).toBeTruthy(),
    )
  })

  it('renders the club past-event recaps', async () => {
    fetchEvents.mockResolvedValue({
      weeklyConnects: [],
      upcoming: [],
      past: [
        {
          id: 'h1',
          aboveTitle: null,
          title: 'Sprint #11 Recap',
          belowTitle: null,
          pastEventEmojiValue: null,
          startTime: null,
        },
      ],
    })
    renderWithClient(<ClubPastSection clubId="5" />)

    await waitFor(() =>
      expect(screen.getByText('Sprint #11 Recap')).toBeTruthy(),
    )
  })
})
