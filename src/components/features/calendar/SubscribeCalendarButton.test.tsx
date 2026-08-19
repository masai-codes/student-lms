// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import {
  SubscribeCalendarButton,
  buildProviderUrl,
} from './SubscribeCalendarButton'

const hoisted = vi.hoisted(() => ({
  fetchLink: vi.fn(),
  pushGtmEvent: vi.fn(),
}))
vi.mock('@/lib/api/calendar/calendarApi', () => ({
  fetchCalendarSubscriptionLink: hoisted.fetchLink,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

const URL_FIXTURE = 'https://lms.example.com/api/calendar/feed/abc123.ics'

function renderButton() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <SubscribeCalendarButton />
    </QueryClientProvider>,
  )
}

describe('buildProviderUrl', () => {
  it('builds the Google cid URL with the http-scheme rewrite (old-LMS parity)', () => {
    expect(buildProviderUrl('google', URL_FIXTURE)).toBe(
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
        'http://lms.example.com/api/calendar/feed/abc123.ics',
      )}`,
    )
  })

  it('builds the Outlook add-from-web URL', () => {
    expect(buildProviderUrl('outlook', URL_FIXTURE)).toContain(
      'outlook.live.com/calendar/0/addfromweb?url=',
    )
  })

  it('builds the Apple webcal URL', () => {
    expect(buildProviderUrl('apple', URL_FIXTURE)).toBe(
      'webcal://lms.example.com/api/calendar/feed/abc123.ics',
    )
  })
})

describe('SubscribeCalendarButton', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.fetchLink.mockResolvedValue({ calendarUrl: URL_FIXTURE })
  })

  it('opens the modal with all four provider rows', async () => {
    renderButton()
    fireEvent.click(screen.getByTestId('my-calendar-subscribe'))
    expect(
      await screen.findByTestId('my-calendar-subscribe-google'),
    ).toBeTruthy()
    expect(screen.getByTestId('my-calendar-subscribe-outlook')).toBeTruthy()
    expect(screen.getByTestId('my-calendar-subscribe-apple')).toBeTruthy()
    expect(screen.getByTestId('my-calendar-subscribe-copy')).toBeTruthy()
    expect(screen.getByText('Google Calendar')).toBeTruthy()
    expect(
      screen.getByText('Paste into any calendar app that supports ICS feeds'),
    ).toBeTruthy()
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_subscribe_open',
      {},
    )
  })

  it('opens the provider URL in a new tab with tracking', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderButton()
    fireEvent.click(screen.getByTestId('my-calendar-subscribe'))
    fireEvent.click(await screen.findByTestId('my-calendar-subscribe-google'))
    expect(openSpy).toHaveBeenCalledWith(
      buildProviderUrl('google', URL_FIXTURE),
      '_blank',
      'noopener,noreferrer',
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_subscribe_google',
      {},
    )
    openSpy.mockRestore()
  })

  it('copies the link and shows the confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    renderButton()
    fireEvent.click(screen.getByTestId('my-calendar-subscribe'))
    fireEvent.click(await screen.findByTestId('my-calendar-subscribe-copy'))
    expect(writeText).toHaveBeenCalledWith(URL_FIXTURE)
    expect(
      await screen.findByTestId('my-calendar-subscribe-copied'),
    ).toBeTruthy()
  })

  it('shows the error state when the link cannot be minted', async () => {
    hoisted.fetchLink.mockRejectedValue(new Error('boom'))
    renderButton()
    fireEvent.click(screen.getByTestId('my-calendar-subscribe'))
    expect(
      await screen.findByTestId('my-calendar-subscribe-error'),
    ).toBeTruthy()
  })
})
