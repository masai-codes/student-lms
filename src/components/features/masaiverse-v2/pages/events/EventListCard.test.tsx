// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EventListCard from './EventListCard'
import type { ReactNode } from 'react'
import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
  }: {
    children: ReactNode
    params?: { eventId?: string }
  }) => (
    <a href="#" data-event-id={params?.eventId}>
      {children}
    </a>
  ),
}))

const NOW = new Date('2026-06-03T12:00:00Z')

function makeEvent(
  overrides: Partial<MasaiverseV2EventListItem> = {},
): MasaiverseV2EventListItem {
  return {
    id: '12',
    imageUrl: 'https://cdn/img.png',
    aboveTitle: null,
    title: 'Build Sprint',
    belowTitle: null,
    category: 'hackathon',
    mode: 'offline',
    locationTitle: 'Bangalore HQ',
    clubId: '7',
    clubName: 'Code Club',
    startTime: '2026-06-03T11:00:00Z',
    endTime: '2026-06-03T13:00:00Z',
    isEnrolled: false,
    ...overrides,
  }
}

afterEach(cleanup)

describe('EventListCard', () => {
  it('renders a live club event with category, club badge, and venue', () => {
    render(<EventListCard event={makeEvent()} now={NOW} />)

    expect(screen.getByRole('link').getAttribute('data-event-id')).toBe('12')
    expect(screen.getByAltText('Build Sprint')).toBeTruthy()
    expect(screen.getByText('LIVE')).toBeTruthy()
    expect(screen.getByText('Hackathon')).toBeTruthy()
    expect(screen.getByText('Code Club')).toBeTruthy()
    expect(screen.getByText('Bangalore HQ')).toBeTruthy()
  })

  it('labels a public online event as Community with an Online line', () => {
    render(
      <EventListCard
        event={makeEvent({
          imageUrl: null,
          category: null,
          mode: 'online',
          clubId: null,
          clubName: null,
          startTime: '2026-06-10T11:00:00Z',
          endTime: '2026-06-10T13:00:00Z',
        })}
        now={NOW}
      />,
    )

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Community')).toBeTruthy()
    expect(screen.getByText('Online')).toBeTruthy()
    expect(screen.queryByText('Hackathon')).toBeNull()
    // An upcoming event shows neither LIVE nor Ended.
    expect(screen.queryByText('LIVE')).toBeNull()
    expect(screen.queryByText('Ended')).toBeNull()
  })

  it('marks a finished event as Ended', () => {
    render(
      <EventListCard
        event={makeEvent({
          startTime: '2026-05-01T11:00:00Z',
          endTime: '2026-05-01T13:00:00Z',
        })}
        now={NOW}
      />,
    )
    expect(screen.getByText('Ended')).toBeTruthy()
  })

  it('shows a Registered badge only when the user is enrolled', () => {
    const { queryByText, rerender } = render(
      <EventListCard event={makeEvent({ isEnrolled: false })} now={NOW} />,
    )
    expect(queryByText('Registered')).toBeNull()

    rerender(
      <EventListCard event={makeEvent({ isEnrolled: true })} now={NOW} />,
    )
    expect(screen.getByText('Registered')).toBeTruthy()
  })

  it('falls back to a venue placeholder and hides the date when timeless', () => {
    render(
      <EventListCard
        event={makeEvent({
          startTime: null,
          endTime: null,
          locationTitle: null,
        })}
        now={NOW}
      />,
    )
    expect(screen.getByText('Venue to be announced')).toBeTruthy()
    expect(screen.getByText('Ended')).toBeTruthy()
  })
})
