// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LearningTenureSection from './LearningTenureSection'
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
    aboutDescription: null,
    aboutDetails: [],
    learningTenureDateText: '20-26 June',
    learningTenure: [
      { emoji: '⚡', heading: 'Heading 1', text: 'Text 1', tags: ['12 sessions'] },
      { emoji: null, heading: 'Heading 2', text: null, tags: [] },
    ],
    galleryImages: [],
    memberCount: 0,
    isJoined: false,
    ...overrides,
  }
}

afterEach(cleanup)

describe('LearningTenureSection', () => {
  it('renders the heading, date label and cards', () => {
    render(<LearningTenureSection club={club()} />)

    expect(screen.getByText('Learning Tenure')).toBeTruthy()
    expect(screen.getByText('20-26 June')).toBeTruthy()
    expect(screen.getByText('Heading 1')).toBeTruthy()
    expect(screen.getByText('Text 1')).toBeTruthy()
    expect(screen.getByText('⚡')).toBeTruthy()
    expect(screen.getByText('12 sessions')).toBeTruthy()
    // Second card has no emoji/text/tags, but its heading still renders.
    expect(screen.getByText('Heading 2')).toBeTruthy()
  })

  it('omits the date pill when there is no date text', () => {
    render(<LearningTenureSection club={club({ learningTenureDateText: null })} />)
    expect(screen.getByText('Learning Tenure')).toBeTruthy()
    expect(screen.queryByText('20-26 June')).toBeNull()
  })

  it('renders nothing when there are no learning-tenure items', () => {
    const { container } = render(
      <LearningTenureSection club={club({ learningTenure: [] })} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
