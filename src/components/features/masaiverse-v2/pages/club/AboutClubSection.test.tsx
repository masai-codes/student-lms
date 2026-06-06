// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import AboutClubSection from './AboutClubSection'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

function club(
  overrides: Partial<MasaiverseV2ClubDetail> = {},
): MasaiverseV2ClubDetail {
  return {
    id: '5',
    name: 'Programming Club',
    imageUrl: null,
    bannerSubtitle: null,
    bannerTags: [],
    aboutDescription: 'The technical heartbeat of MasaiVerse.',
    aboutDetails: [
      { heading: 'Founded', value: 'September 2023' },
      { heading: 'Meeting Cadence', value: '3× per week' },
    ],
    learningTenureDateText: null,
    learningTenure: [],
    galleryImages: [],
    memberCount: 0,
    isJoined: false,
    stats: null,
    events: { weeklyConnects: [], upcoming: [], past: [] },
    leaderboard: { entries: [], page: 1, perPage: 5, total: 0, hasMore: false },
    discussions: [],
    ...overrides,
  }
}

afterEach(cleanup)

describe('AboutClubSection', () => {
  it('renders the description and labelled detail rows', () => {
    render(<AboutClubSection club={club()} />)

    expect(screen.getByText('About the Club')).toBeTruthy()
    expect(
      screen.getByText('The technical heartbeat of MasaiVerse.'),
    ).toBeTruthy()
    expect(screen.getByText('Founded')).toBeTruthy()
    expect(screen.getByText('September 2023')).toBeTruthy()
    expect(screen.getByText('Meeting Cadence')).toBeTruthy()
    expect(screen.getByText('3× per week')).toBeTruthy()
  })

  it('renders details with no description', () => {
    render(<AboutClubSection club={club({ aboutDescription: null })} />)

    expect(screen.getByText('Founded')).toBeTruthy()
    expect(
      screen.queryByText('The technical heartbeat of MasaiVerse.'),
    ).toBeNull()
  })

  it('renders the description with no detail rows', () => {
    render(<AboutClubSection club={club({ aboutDetails: [] })} />)

    expect(
      screen.getByText('The technical heartbeat of MasaiVerse.'),
    ).toBeTruthy()
    expect(screen.queryByText('Founded')).toBeNull()
  })

  it('renders nothing when there is no about content', () => {
    const { container } = render(
      <AboutClubSection club={club({ aboutDescription: null, aboutDetails: [] })} />,
    )

    expect(container.firstChild).toBeNull()
  })
})
