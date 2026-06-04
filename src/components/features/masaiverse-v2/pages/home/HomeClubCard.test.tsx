// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import HomeClubCard from './HomeClubCard'
import type { MasaiverseV2HomeClub } from '@/server/api/masaiverse-v2/services/getHomeClubs.service'

function makeClub(
  overrides: Partial<MasaiverseV2HomeClub> = {},
): MasaiverseV2HomeClub {
  return {
    id: '1',
    name: 'Programming Club',
    imageUrl: 'https://cdn/club.png',
    belowTitleCardText: 'Code · DSA · Projects',
    cardDescription: 'Weekly challenges, code reviews & a DSA series.',
    memberCount: 428,
    sampleMemberNames: ['Aman Kumar', 'Priya Rao', 'Sam Niko'],
    ...overrides,
  }
}

afterEach(cleanup)

describe('HomeClubCard', () => {
  it('renders the image, name, descriptions, member initials and count', () => {
    render(<HomeClubCard club={makeClub()} />)

    const image = screen.getByAltText<HTMLImageElement>('Programming Club')
    expect(image.src).toBe('https://cdn/club.png')
    expect(screen.getByText('Programming Club')).toBeTruthy()
    expect(screen.getByText('Code · DSA · Projects')).toBeTruthy()
    expect(
      screen.getByText('Weekly challenges, code reviews & a DSA series.'),
    ).toBeTruthy()
    expect(screen.getByText('428 members')).toBeTruthy()
    // Initials from the sample member names.
    expect(screen.getByText('AK')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText('SN')).toBeTruthy()
    // More members than shown → a "+" chip.
    expect(screen.getByText('+')).toBeTruthy()
  })

  it('falls back to a name initial when there is no image', () => {
    render(<HomeClubCard club={makeClub({ imageUrl: null })} />)

    expect(screen.queryByRole('img')).toBeNull()
    // Avatar fallback uses the club-name initials.
    expect(screen.getByText('PC')).toBeTruthy()
  })

  it('omits the "+" chip when the sample already covers every member', () => {
    render(
      <HomeClubCard
        club={makeClub({ memberCount: 1, sampleMemberNames: ['Aman Kumar'] })}
      />,
    )
    expect(screen.queryByText('+')).toBeNull()
    expect(screen.getByText('1 members')).toBeTruthy()
  })

  it('hides the members row entirely when there are no members', () => {
    render(
      <HomeClubCard
        club={makeClub({ memberCount: 0, sampleMemberNames: [] })}
      />,
    )
    expect(screen.queryByText(/members/)).toBeNull()
  })
})
