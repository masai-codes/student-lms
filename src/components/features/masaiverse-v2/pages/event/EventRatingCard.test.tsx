// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventRatingCard from './EventRatingCard'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'

const { rate } = vi.hoisted(() => ({ rate: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  rateMasaiverseV2Event: rate,
}))

function makeEvent(
  overrides: Partial<MasaiverseV2EventDetail> = {},
): MasaiverseV2EventDetail {
  return {
    id: '7',
    title: 'Build Sprint',
    description: null,
    imageUrl: null,
    category: 'hackathon',
    mode: 'online',
    eventLink: 'https://meet.example/x',
    locationTitle: null,
    locationMapLink: null,
    platform: 'Zoom',
    startTime: '2026-06-01T09:00:00Z',
    endTime: '2026-06-01T11:00:00Z',
    aboveTitle: null,
    belowTitle: null,
    isWeeklyConnect: false,
    clubId: null,
    clubName: null,
    isClubMember: true,
    clubConfirmationModalText: null,
    status: 'completed',
    isEnrolled: true,
    enrolledCount: 10,
    userRating: null,
    userFeedback: null,
    hostedBy: [],
    confirmationModalText: null,
    eventSummary: null,
    ...overrides,
  }
}

function renderCard(event: MasaiverseV2EventDetail) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(masaiverseV2EventDetailQuery(event.id).queryKey, event)
  render(
    <QueryClientProvider client={client}>
      <EventRatingCard event={event} />
    </QueryClientProvider>,
  )
  return client
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('EventRatingCard', () => {
  it('renders nothing until the event has ended', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <EventRatingCard event={makeEvent({ status: 'upcoming' })} />
      </QueryClientProvider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for a non-attendee', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <EventRatingCard event={makeEvent({ isEnrolled: false })} />
      </QueryClientProvider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('disables submit until a star is picked, then rates and thanks the user', async () => {
    rate.mockResolvedValueOnce({ rating: 4, feedback: null })
    const client = renderCard(makeEvent())

    const submit = screen.getByRole('button', { name: 'Submit rating' })
    expect((submit as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }))
    expect((submit as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(submit)

    await waitFor(() =>
      expect(rate).toHaveBeenCalledWith({
        eventId: '7',
        rating: 4,
        feedback: undefined,
      }),
    )
    // Flips to the thank-you state in place, and patches the cached detail.
    expect(await screen.findByText('Thanks for rating!')).toBeTruthy()
    const cached = client.getQueryData<MasaiverseV2EventDetail>(
      masaiverseV2EventDetailQuery('7').queryKey,
    )
    expect(cached).toMatchObject({ userRating: 4 })
  })

  it('sends trimmed feedback when provided', async () => {
    rate.mockResolvedValueOnce({ rating: 5, feedback: 'Loved it' })
    renderCard(makeEvent())

    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 stars' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  Loved it  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit rating' }))

    await waitFor(() =>
      expect(rate).toHaveBeenCalledWith({
        eventId: '7',
        rating: 5,
        feedback: 'Loved it',
      }),
    )
  })

  it('shows a read-only confirmation when already rated', () => {
    renderCard(makeEvent({ userRating: 3, userFeedback: 'Solid session' }))

    expect(screen.getByText('Thanks for rating!')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Rated 3 out of 5' })).toBeTruthy()
    expect(screen.getByText('“Solid session”')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Submit rating' })).toBeNull()
  })

  it('surfaces an error when rating fails', async () => {
    rate.mockRejectedValueOnce(new Error('nope'))
    renderCard(makeEvent())

    fireEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit rating' }))

    expect(await screen.findByText(/Couldn't submit your rating/)).toBeTruthy()
  })
})
