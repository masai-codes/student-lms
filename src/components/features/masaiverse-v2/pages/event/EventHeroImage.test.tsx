// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EventHeroImage from './EventHeroImage'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'

function makeEvent(
  overrides: Partial<MasaiverseV2EventDetail> = {},
): MasaiverseV2EventDetail {
  return {
    id: '7',
    title: 'Build Sprint',
    description: null,
    imageUrl: 'https://cdn/sprint.png',
    category: 'hackathon',
    mode: 'online',
    eventLink: 'https://meet.example/x',
    locationTitle: null,
    locationMapLink: null,
    platform: 'Zoom',
    startTime: '2026-06-10T09:00:00Z',
    endTime: '2026-06-10T11:00:00Z',
    aboveTitle: null,
    belowTitle: null,
    isWeeklyConnect: false,
    clubId: null,
    clubName: null,
    isClubMember: true,
    clubConfirmationModalText: null,
    status: 'upcoming',
    isEnrolled: false,
    enrolledCount: 0,
    userRating: null,
    userFeedback: null,
    hostedBy: [],
    confirmationModalText: null,
    eventSummary: null,
    ...overrides,
  }
}

afterEach(cleanup)

describe('EventHeroImage', () => {
  it('renders the banner image when present', () => {
    render(<EventHeroImage event={makeEvent()} />)
    const image = screen.getByAltText<HTMLImageElement>('Build Sprint')
    expect(image.src).toBe('https://cdn/sprint.png')
  })

  it('shows a placeholder and no image when imageUrl is null', () => {
    render(<EventHeroImage event={makeEvent({ imageUrl: null })} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows a LIVE badge only for a live event', () => {
    const { rerender } = render(<EventHeroImage event={makeEvent()} />)
    expect(screen.queryByText('Live')).toBeNull()
    rerender(<EventHeroImage event={makeEvent({ status: 'live' })} />)
    expect(screen.getByText('Live')).toBeTruthy()
  })
})
