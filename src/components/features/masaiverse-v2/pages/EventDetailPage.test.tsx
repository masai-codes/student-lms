// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventDetailPage from './EventDetailPage'
import type { ReactNode } from 'react'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { ApiClientError } from '@/lib/api/apiClientError'

const { fetchDetail, enroll } = vi.hoisted(() => ({
  fetchDetail: vi.fn(),
  enroll: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2EventDetail: fetchDetail,
  enrollMasaiverseV2Event: enroll,
  // The page is wrapped in the edit provider; default to a non-admin so the
  // edit affordances stay hidden and these tests see the read-only page.
  fetchMasaiverseV2AdminMode: vi.fn().mockResolvedValue({
    isAdmin: false,
    enabled: false,
  }),
  updateMasaiverseV2Event: vi.fn(),
  updateMasaiverseV2Club: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))

function makeEvent(
  overrides: Partial<MasaiverseV2EventDetail> = {},
): MasaiverseV2EventDetail {
  return {
    id: '7',
    title: 'Build Sprint',
    description: 'A weekend hackathon.\nBring your laptop.',
    imageUrl: 'https://cdn/sprint.png',
    category: 'hackathon',
    mode: 'offline',
    eventLink: null,
    locationTitle: 'Masai HQ',
    locationMapLink: 'https://maps.example/hq',
    platform: null,
    startTime: '2026-06-10T09:00:00Z',
    endTime: '2026-06-10T11:00:00Z',
    aboveTitle: 'FLAGSHIP',
    belowTitle: '48 teams competing',
    isWeeklyConnect: true,
    confirmationModalText: null,
    clubId: '3',
    clubName: 'Programming Club',
    status: 'upcoming',
    isEnrolled: false,
    enrolledCount: 4,
    userRating: null,
    userFeedback: null,
    hostedBy: [],
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <EventDetailPage eventId="7" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('EventDetailPage', () => {
  it('shows a loading state while the query is pending', () => {
    fetchDetail.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status', { name: 'Loading event' })).toBeTruthy()
  })

  it('renders the event once loaded, including title, host, pills and about', async () => {
    fetchDetail.mockResolvedValue(makeEvent())
    renderPage()

    expect(await screen.findByText('Build Sprint')).toBeTruthy()
    expect(screen.getByText('FLAGSHIP')).toBeTruthy()
    expect(screen.getByText('48 teams competing')).toBeTruthy()
    expect(screen.getByText('Programming Club')).toBeTruthy()
    expect(screen.getByText('Weekly Connect')).toBeTruthy()
    expect(screen.getByText('hackathon')).toBeTruthy()
    expect(screen.getByText('In-person')).toBeTruthy()
    expect(screen.getByText('About this event')).toBeTruthy()
    expect(screen.getByLabelText('4 people registered')).toBeTruthy()
  })

  it('renders the "Hosted By" section from hostedBy', async () => {
    fetchDetail.mockResolvedValue(
      makeEvent({
        hostedBy: [
          { name: 'Aman Kumar', imageUrl: 'https://cdn/aman.png' },
          { name: 'Priya Rao', imageUrl: null },
        ],
      }),
    )
    renderPage()

    expect(await screen.findByText('Hosted By')).toBeTruthy()
    expect(screen.getByText('Aman Kumar')).toBeTruthy()
    expect(screen.getByText('Priya Rao')).toBeTruthy()
  })

  it('renders the description as rich markdown/HTML, not plain text', async () => {
    fetchDetail.mockResolvedValue(
      makeEvent({
        description:
          'Join us this **weekend**.\n\n<a href="https://masai.test">Details here</a>',
      }),
    )
    renderPage()

    // The bold markdown becomes a <strong>, and the raw anchor becomes a link.
    const bold = await screen.findByText('weekend')
    expect(bold.tagName).toBe('STRONG')
    const link = screen.getByRole('link', { name: 'Details here' })
    expect(link.getAttribute('href')).toBe('https://masai.test')
    // Markdown markers and raw tags are not shown verbatim.
    expect(screen.queryByText(/\*\*weekend\*\*/)).toBeNull()
  })

  it('omits optional blocks when the event has none', async () => {
    fetchDetail.mockResolvedValue(
      makeEvent({
        aboveTitle: null,
        belowTitle: null,
        clubName: null,
        description: null,
        isWeeklyConnect: false,
        category: null,
        mode: null,
      }),
    )
    renderPage()

    expect(await screen.findByText('Build Sprint')).toBeTruthy()
    expect(screen.queryByText('FLAGSHIP')).toBeNull()
    expect(screen.queryByText('About this event')).toBeNull()
  })

  it('shows a not-found message for a 404', async () => {
    fetchDetail.mockRejectedValue(new ApiClientError(404, { code: 'X' }))
    renderPage()
    expect(await screen.findByText('Event not found')).toBeTruthy()
  })

  it('shows a generic error message for other failures', async () => {
    fetchDetail.mockRejectedValue(new Error('boom'))
    renderPage()
    expect(await screen.findByText('Something went wrong')).toBeTruthy()
  })
})
