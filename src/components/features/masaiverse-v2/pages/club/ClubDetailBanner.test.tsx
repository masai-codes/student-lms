// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubDetailBanner from './ClubDetailBanner'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  setMasaiverseV2ClubMembership: vi.fn(),
}))

function renderBanner(club: MasaiverseV2ClubDetail) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClubDetailBanner club={club} />
    </QueryClientProvider>,
  )
}

const baseClub: MasaiverseV2ClubDetail = {
  id: '5',
  name: 'Programming Club',
  imageUrl: null,
  bannerSubtitle: 'Code. Build. Ship. Repeat. · Est. Batch 23',
  bannerTags: ['Code · DSA · Projects', 'Tenure 4 · Active'],
  aboutDescription: null,
  aboutDetails: [],
  learningTenureDateText: null,
  learningTenure: [],
  galleryImages: [],
  memberCount: 234,
  isJoined: true,
  stats: null,
  events: { weeklyConnects: [], upcoming: [], past: [] },
  leaderboard: { entries: [], page: 1, perPage: 5, total: 0, hasMore: false },
  discussions: [],
  confirmationModalText: null,
}

afterEach(cleanup)

describe('ClubDetailBanner', () => {
  it('renders the title, subtitle and an initials fallback when no image', () => {
    renderBanner(baseClub)
    expect(
      screen.getByRole('heading', { name: 'Programming Club' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Code. Build. Ship. Repeat. · Est. Batch 23'),
    ).toBeTruthy()
    expect(screen.getByText('PC')).toBeTruthy()
  })

  it('builds pills as [first tag, member count, ...rest tags]', () => {
    renderBanner(baseClub)
    const section = screen
      .getByRole('heading', { name: 'Programming Club' })
      .closest('section') as HTMLElement
    const pillText = within(section)
      .getAllByText(/Code · DSA · Projects|members|Tenure 4 · Active/)
      .map((el) => el.textContent)
    expect(pillText).toEqual([
      'Code · DSA · Projects',
      '234 members',
      'Tenure 4 · Active',
    ])
  })

  it('still shows the member count pill when there are no meta tags', () => {
    renderBanner({ ...baseClub, bannerTags: [] })
    expect(screen.getByText('234 members')).toBeTruthy()
  })

  it('renders the club image when provided', () => {
    renderBanner({ ...baseClub, imageUrl: 'https://cdn/c.png' })
    const img = screen.getByAltText<HTMLImageElement>('Programming Club')
    expect(img.getAttribute('src')).toBe('https://cdn/c.png')
  })
})
