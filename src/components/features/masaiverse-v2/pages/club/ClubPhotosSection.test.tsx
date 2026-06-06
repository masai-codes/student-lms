// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ClubPhotosSection from './ClubPhotosSection'
import type { ReactNode } from 'react'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))

function club(images: Array<string>): MasaiverseV2ClubDetail {
  return {
    id: '5',
    name: 'Programming Club',
    imageUrl: null,
    bannerSubtitle: null,
    bannerTags: [],
    aboutDescription: null,
    aboutDetails: [],
    learningTenureDateText: null,
    learningTenure: [],
    galleryImages: images,
    memberCount: 0,
    isJoined: false,
    stats: null,
    events: { weeklyConnects: [], upcoming: [], past: [] },
    leaderboard: { entries: [], page: 1, perPage: 5, total: 0, hasMore: false },
    discussions: [],
  }
}

const urls = (n: number) =>
  Array.from({ length: n }, (_, i) => `https://cdn/p${i}.jpg`)

afterEach(cleanup)

describe('ClubPhotosSection', () => {
  it('renders nothing when there are no photos', () => {
    const { container } = render(<ClubPhotosSection club={club([])} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the header, gallery link and photo tiles', () => {
    const { container } = render(<ClubPhotosSection club={club(urls(3))} />)
    expect(screen.getByText('Club Photos')).toBeTruthy()
    expect(screen.getByText('Event highlights')).toBeTruthy()
    expect(screen.getByText('View gallery →')).toBeTruthy()
    // 1 big + 2 small = 3 images, no overlay.
    expect(container.querySelectorAll('img')).toHaveLength(3)
    expect(screen.queryByText('more photos')).toBeNull()
  })

  it('overlays "+N more photos" on the last tile when there are extras', () => {
    const { container } = render(<ClubPhotosSection club={club(urls(8))} />)
    // Shows at most 5 tiles (1 big + 4 small).
    expect(container.querySelectorAll('img')).toHaveLength(5)
    expect(screen.getByText('+3')).toBeTruthy()
    expect(screen.getByText('more photos')).toBeTruthy()
  })

  it('shows only the big tile for a single photo', () => {
    const { container } = render(<ClubPhotosSection club={club(urls(1))} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(screen.queryByText('more photos')).toBeNull()
  })
})
