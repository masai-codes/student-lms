// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EventCard from './EventCard'
import type { ReactNode } from 'react'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'

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
  overrides: Partial<MasaiverseV2HomeEvent> = {},
): MasaiverseV2HomeEvent {
  return {
    id: '12',
    imageUrl: 'https://cdn/build-sprint.png',
    aboveTitle: 'WEEKLY HACKATHON',
    title: 'Build Sprint #12',
    belowTitle: '48 teams · ends Sunday',
    startTime: '2026-06-03T11:00:00Z',
    endTime: '2026-06-03T13:00:00Z',
    isEnrolled: false,
    ...overrides,
  }
}

afterEach(cleanup)

describe('EventCard', () => {
  it('renders the image and three text lines from the event', () => {
    render(<EventCard event={makeEvent()} now={NOW} />)

    const image = screen.getByAltText<HTMLImageElement>('Build Sprint #12')
    expect(image.src).toBe('https://cdn/build-sprint.png')
    expect(screen.getByText('WEEKLY HACKATHON')).toBeTruthy()
    expect(screen.getByText('Build Sprint #12')).toBeTruthy()
    expect(screen.getByText('48 teams · ends Sunday')).toBeTruthy()
  })

  it('links to the event detail route with the event id', () => {
    render(<EventCard event={makeEvent()} now={NOW} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('data-event-id')).toBe('12')
  })

  it('shows a LIVE badge for a running event', () => {
    render(<EventCard event={makeEvent()} now={NOW} />)
    expect(screen.getByText('LIVE')).toBeTruthy()
  })

  it('shows a Registered badge only when the user is enrolled', () => {
    const { rerender } = render(
      <EventCard event={makeEvent({ isEnrolled: false })} now={NOW} />,
    )
    expect(screen.queryByText('Registered')).toBeNull()

    rerender(<EventCard event={makeEvent({ isEnrolled: true })} now={NOW} />)
    expect(screen.getByText('Registered')).toBeTruthy()
  })

  it('omits optional lines and image when absent', () => {
    render(
      <EventCard
        event={makeEvent({
          imageUrl: null,
          aboveTitle: null,
          belowTitle: null,
        })}
        now={NOW}
      />,
    )

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByText('WEEKLY HACKATHON')).toBeNull()
    expect(screen.getByText('Build Sprint #12')).toBeTruthy()
  })
})
