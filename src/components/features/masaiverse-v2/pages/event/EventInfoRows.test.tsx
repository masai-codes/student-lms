// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EventInfoRows from './EventInfoRows'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'

function makeEvent(
  overrides: Partial<MasaiverseV2EventDetail> = {},
): MasaiverseV2EventDetail {
  return {
    id: '7',
    title: 'Build Sprint',
    description: null,
    imageUrl: null,
    category: 'meetup',
    mode: 'offline',
    eventLink: null,
    locationTitle: 'Masai HQ, Bengaluru',
    locationMapLink: 'https://maps.example/hq',
    platform: null,
    startTime: '2026-06-10T09:00:00Z',
    endTime: '2026-06-10T11:30:00Z',
    aboveTitle: null,
    belowTitle: null,
    isWeeklyConnect: false,
    clubId: null,
    clubName: null,
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

describe('EventInfoRows', () => {
  it('shows the IST date badge, long date and time range', () => {
    render(<EventInfoRows event={makeEvent()} />)
    expect(screen.getByText('JUN')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText('Wednesday, 10 June 2026')).toBeTruthy()
    expect(screen.getByText('2:30 PM – 5:00 PM IST')).toBeTruthy()
  })

  it('renders the location for an offline event', () => {
    render(<EventInfoRows event={makeEvent()} />)
    expect(screen.getByText('Masai HQ, Bengaluru')).toBeTruthy()
  })

  it('renders the platform and a link hint for an online event', () => {
    render(
      <EventInfoRows
        event={makeEvent({
          mode: 'online',
          locationTitle: null,
          locationMapLink: null,
          platform: 'Zoom',
        })}
      />,
    )
    expect(screen.getByText('Zoom')).toBeTruthy()
    expect(screen.getByText('Link shared after you register')).toBeTruthy()
  })

  it('falls back to generic labels and announces a missing date', () => {
    render(
      <EventInfoRows
        event={makeEvent({
          mode: 'online',
          platform: null,
          locationTitle: null,
          startTime: null,
          endTime: null,
        })}
      />,
    )
    expect(screen.getByText('Online event')).toBeTruthy()
    expect(screen.getByText('Date to be announced')).toBeTruthy()
  })

  it('falls back to a generic in-person label when offline has no location', () => {
    render(
      <EventInfoRows
        event={makeEvent({ locationTitle: null, platform: 'On campus' })}
      />,
    )
    expect(screen.getByText('In-person event')).toBeTruthy()
    expect(screen.getByText('On campus')).toBeTruthy()
  })
})
