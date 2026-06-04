// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EventsCarousel from './EventsCarousel'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'

function event(id: string, title: string): MasaiverseV2HomeEvent {
  return {
    id,
    imageUrl: null,
    aboveTitle: null,
    title,
    belowTitle: null,
    startTime: null,
    endTime: null,
  }
}

afterEach(cleanup)

describe('EventsCarousel', () => {
  it('renders the loading state', () => {
    render(
      <EventsCarousel
        events={[]}
        isPending
        loadingLabel="Loading events"
        emptyMessage="Nothing here"
      />,
    )
    expect(screen.getByLabelText('Loading events')).toBeTruthy()
  })

  it('renders the empty message', () => {
    render(
      <EventsCarousel
        events={[]}
        isPending={false}
        loadingLabel="Loading events"
        emptyMessage="No events"
      />,
    )
    expect(screen.getByText('No events')).toBeTruthy()
  })

  it('renders a single event without nav controls', () => {
    render(
      <EventsCarousel
        events={[event('1', 'Solo Event')]}
        isPending={false}
        loadingLabel="Loading events"
        emptyMessage="No events"
      />,
    )
    expect(screen.getByText('Solo Event')).toBeTruthy()
    expect(screen.queryByLabelText('Next events')).toBeNull()
  })

  it('renders nav controls when there is more than one event', () => {
    render(
      <EventsCarousel
        events={[event('1', 'First'), event('2', 'Second')]}
        isPending={false}
        loadingLabel="Loading events"
        emptyMessage="No events"
        navKey="club-events"
      />,
    )
    expect(screen.getByLabelText('Next events')).toBeTruthy()
  })
})
