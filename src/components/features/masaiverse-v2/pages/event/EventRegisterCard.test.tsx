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
import EventRegisterCard from './EventRegisterCard'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'

const { enroll } = vi.hoisted(() => ({ enroll: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  enrollMasaiverseV2Event: enroll,
  fetchMasaiverseV2EventDetail: vi.fn(),
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
    locationMapLink: 'https://maps.example/hq',
    platform: 'Zoom',
    startTime: '2026-06-10T09:00:00Z',
    endTime: '2026-06-10T11:00:00Z',
    aboveTitle: null,
    belowTitle: null,
    isWeeklyConnect: false,
    confirmationModalText: null,
    clubId: null,
    clubName: null,
    status: 'upcoming',
    isEnrolled: false,
    enrolledCount: 0,
    userRating: null,
    userFeedback: null,
    hostedBy: [],
    ...overrides,
  }
}

function renderCard(
  event: MasaiverseV2EventDetail,
  { seedCache = false }: { seedCache?: boolean } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  // Seeding lets us assert the cache is patched on a successful registration.
  if (seedCache) {
    client.setQueryData(masaiverseV2EventDetailQuery(event.id).queryKey, event)
  }
  render(
    <QueryClientProvider client={client}>
      <EventRegisterCard event={event} />
    </QueryClientProvider>,
  )
  return client
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('EventRegisterCard', () => {
  it('shows an ended message for a completed event', () => {
    renderCard(makeEvent({ status: 'completed' }))
    expect(screen.getByText('This event has ended.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('registers, patches the cached detail and confirms in place without redirecting', async () => {
    enroll.mockResolvedValueOnce({
      isEnrolled: true,
      enrolledCount: 1,
      redirectUrl: 'https://meet.example/x',
    })
    const event = makeEvent()
    const client = renderCard(event, { seedCache: true })

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(enroll).toHaveBeenCalledWith('7'))
    // The user stays put: registering never triggers an automatic redirect.
    expect(window.open).not.toHaveBeenCalled()
    const cached = client.getQueryData<MasaiverseV2EventDetail>(
      masaiverseV2EventDetailQuery(event.id).queryKey,
    )
    expect(cached).toMatchObject({ isEnrolled: true, enrolledCount: 1 })
  })

  it('flips to the confirmation UI in place right after registering', async () => {
    enroll.mockResolvedValueOnce({
      isEnrolled: true,
      enrolledCount: 3,
      redirectUrl: null,
    })
    renderCard(makeEvent())

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    // No page refresh needed: the card shows the confirmation and updated count.
    expect(await screen.findByText("You're registered! 🎉")).toBeTruthy()
    expect(screen.getByLabelText('3 people registered')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull()
  })

  it('registers directly without a dialog when no confirmation text is set', async () => {
    enroll.mockResolvedValueOnce({
      isEnrolled: true,
      enrolledCount: 1,
      redirectUrl: null,
    })
    renderCard(makeEvent())

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    await waitFor(() => expect(enroll).toHaveBeenCalledWith('7'))
    // No confirmation dialog appears for events without notice text.
    expect(screen.queryByText('Confirm your registration')).toBeNull()
  })

  it('opens a confirmation dialog and only registers after acknowledging', async () => {
    enroll.mockResolvedValueOnce({
      isEnrolled: true,
      enrolledCount: 1,
      redirectUrl: null,
    })
    renderCard(
      makeEvent({ confirmationModalText: 'Please **read the rules** first.' }),
    )

    // Clicking Register opens the dialog instead of calling the API.
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByText('Confirm your registration')).toBeTruthy()
    expect(screen.getByText('read the rules')).toBeTruthy()
    expect(enroll).not.toHaveBeenCalled()

    // The confirm action stays disabled until the checkbox is ticked.
    const confirmButton = screen.getByRole('button', { name: 'Confirm & register' })
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('checkbox'))
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(confirmButton)

    await waitFor(() => expect(enroll).toHaveBeenCalledWith('7'))
  })

  it('never redirects on registration even when a url is returned', async () => {
    enroll.mockResolvedValueOnce({
      isEnrolled: true,
      enrolledCount: 1,
      redirectUrl: null,
    })
    renderCard(makeEvent())

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    await waitFor(() => expect(enroll).toHaveBeenCalled())
    expect(window.open).not.toHaveBeenCalled()
  })

  it('lets an enrolled user join an online event', () => {
    renderCard(makeEvent({ isEnrolled: true, enrolledCount: 5 }))
    expect(screen.getByText("You're registered! 🎉")).toBeTruthy()
    expect(screen.getByLabelText('5 people registered')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Join event' }))
    expect(window.open).toHaveBeenCalledWith(
      'https://meet.example/x',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('lets an enrolled user get directions for an offline event', () => {
    renderCard(
      makeEvent({ mode: 'offline', isEnrolled: true, enrolledCount: 1 }),
    )
    expect(screen.getByLabelText('1 person registered')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Get directions' }))
    expect(window.open).toHaveBeenCalledWith(
      'https://maps.example/hq',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('omits the open button for an enrolled event with no link', () => {
    renderCard(
      makeEvent({ isEnrolled: true, mode: 'online', eventLink: null }),
    )
    expect(screen.getByText("You're registered! 🎉")).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
