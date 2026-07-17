// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ActiveClubsSection from './ActiveClubsSection'
import type { ReactNode } from 'react'

const { fetchHome } = vi.hoisted(() => ({ fetchHome: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2Home: fetchHome,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    className,
  }: {
    children: ReactNode
    to?: string
    params?: { clubId?: string }
    className?: string
  }) => (
    <a href={to} data-club-id={params?.clubId} className={className}>
      {children}
    </a>
  ),
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const club = {
  id: '1',
  name: 'Programming Club',
  imageUrl: null,
  belowTitleCardText: 'Code · DSA',
  cardDescription: 'Weekly challenges.',
  memberCount: 428,
  sampleMemberNames: ['Aman Kumar'],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ActiveClubsSection', () => {
  it('shows a loading message while fetching', () => {
    fetchHome.mockReturnValue(new Promise(() => {}))
    renderWithClient(<ActiveClubsSection />)
    expect(screen.getByText('Loading clubs…')).toBeTruthy()
  })

  it('renders club cards once loaded', async () => {
    fetchHome.mockResolvedValue({
      stats: {},
      events: [],
      highlights: [],
      clubs: [club],
    })
    renderWithClient(<ActiveClubsSection />)

    await waitFor(() =>
      expect(screen.getByText('Programming Club')).toBeTruthy(),
    )
    expect(screen.getByText('428 members')).toBeTruthy()
    // A single club needs no carousel navigation.
    expect(screen.queryByLabelText('Next clubs')).toBeNull()
  })

  it('links each club card to its detail page', async () => {
    fetchHome.mockResolvedValue({
      stats: {},
      events: [],
      highlights: [],
      clubs: [club],
    })
    renderWithClient(<ActiveClubsSection />)

    await waitFor(() =>
      expect(screen.getByText('Programming Club')).toBeTruthy(),
    )
    const cardLink = screen
      .getByText('Programming Club')
      .closest('a[data-club-id]')
    expect(cardLink?.getAttribute('href')).toBe('/masaiverse/club/$clubId')
    expect(cardLink?.getAttribute('data-club-id')).toBe('1')
  })

  it('shows carousel navigation when there is more than one club', async () => {
    fetchHome.mockResolvedValue({
      stats: {},
      events: [],
      highlights: [],
      clubs: [club, { ...club, id: '2', name: 'Design Circle' }],
    })
    renderWithClient(<ActiveClubsSection />)

    await waitFor(() => expect(screen.getByText('Design Circle')).toBeTruthy())
    expect(screen.getByLabelText('Previous clubs')).toBeTruthy()
    expect(screen.getByLabelText('Next clubs')).toBeTruthy()
  })

  it('shows an empty state when there are no clubs', async () => {
    fetchHome.mockResolvedValue({
      stats: {},
      events: [],
      highlights: [],
      clubs: [],
    })
    renderWithClient(<ActiveClubsSection />)

    await waitFor(() => expect(screen.getByText('No clubs yet.')).toBeTruthy())
  })
})
