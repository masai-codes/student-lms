// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'
import type { MyCalendarEvent } from '@/lib/calendar/calendarEventMapping'

import { MyCalendarPage } from './MyCalendarPage'

const hoisted = vi.hoisted(() => ({
  fetchEvents: vi.fn(),
  fetchBatches: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/calendar/calendarApi', () => ({
  fetchCalendarEvents: hoisted.fetchEvents,
  fetchCalendarBatches: hoisted.fetchBatches,
  fetchCalendarSubscriptionLink: vi.fn(),
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))
// Stub the grid: jsdom has no layout, so assert on the wiring instead.
vi.mock('react-big-calendar', () => ({
  dayjsLocalizer: () => ({}),
  Calendar: (props: {
    events: Array<MyCalendarEvent>
    onSelectEvent: (event: MyCalendarEvent) => void
  }) => (
    <div data-testid="rbc-stub">
      {props.events.map((event) => (
        <button
          key={event.key}
          type="button"
          data-testid="rbc-stub-event"
          onClick={() => props.onSelectEvent(event)}
        >
          {event.title}
        </button>
      ))}
    </div>
  ),
}))

const dto = (over: Partial<CalendarEventDto> = {}): CalendarEventDto => ({
  id: 7,
  type: 'lecture',
  title: 'DSA Session',
  schedule: '2026-08-14T10:00:00+05:30',
  concludes: '2026-08-14T12:00:00+05:30',
  effectiveEnd: '2026-08-14T12:00:00+05:30',
  optional: false,
  sectionId: 5,
  sectionName: null,
  batchName: null,
  hostName: null,
  detailPath: '/lectures/7',
  joinLive: null,
  ...over,
})

function renderPage(
  search: {
    view?: 'month' | 'week' | 'day'
    date?: string
    batchId?: number
  } = {},
) {
  const onSearchChange = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MyCalendarPage search={search} onSearchChange={onSearchChange} />
    </QueryClientProvider>,
  )
  return onSearchChange
}

describe('MyCalendarPage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })
  beforeEach(() => {
    vi.clearAllMocks()
    // Pin "today" away from the fixture dates so the "defaults stay out of
    // the URL" collapsing in patchSearch doesn't collide with the real date.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-01-15T00:00:00+05:30'))
    hoisted.fetchBatches.mockResolvedValue({ batches: [] })
    hoisted.fetchEvents.mockResolvedValue({
      range: { start: '2026-08-09', end: '2026-08-15' },
      events: [dto()],
    })
  })

  it('shows the skeleton, then the grid with fetched events', async () => {
    renderPage({ date: '2026-08-14' })
    expect(screen.getByTestId('my-calendar-skeleton')).toBeTruthy()
    expect(await screen.findByTestId('my-calendar-grid')).toBeTruthy()
    expect(screen.getByTestId('rbc-stub-event').textContent).toBe('DSA Session')
  })

  it('requests the visible week range for the anchor date', async () => {
    renderPage({ date: '2026-08-14' })
    await screen.findByTestId('my-calendar-grid')
    expect(hoisted.fetchEvents).toHaveBeenCalledWith({
      start: '2026-08-09',
      end: '2026-08-15',
      batchId: undefined,
    })
  })

  it('opens the details modal when an event is selected, with tracking', async () => {
    renderPage({ date: '2026-08-14' })
    fireEvent.click(await screen.findByTestId('rbc-stub-event'))
    expect(
      screen.getByTestId('my-calendar-event-modal-title').textContent,
    ).toBe('DSA Session')
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_lecture_event_click_id_7',
      { title: 'DSA Session', view: 'week' },
    )
  })

  it('navigates by patching the URL search', async () => {
    const onSearchChange = renderPage({ date: '2026-08-14' })
    fireEvent.click(await screen.findByTestId('my-calendar-next'))
    expect(onSearchChange).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-08-21' }),
    )
    fireEvent.click(screen.getByTestId('my-calendar-today'))
    expect(onSearchChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: undefined }),
    )
  })

  it('shows the empty state when the range has no events', async () => {
    hoisted.fetchEvents.mockResolvedValue({
      range: { start: '2026-08-09', end: '2026-08-15' },
      events: [],
    })
    renderPage({ date: '2026-08-14' })
    expect(await screen.findByTestId('my-calendar-empty')).toBeTruthy()
  })

  it('shows the error state with a working retry', async () => {
    hoisted.fetchEvents.mockRejectedValueOnce(new Error('boom'))
    renderPage({ date: '2026-08-14' })
    expect(await screen.findByTestId('my-calendar-error')).toBeTruthy()
    fireEvent.click(screen.getByTestId('my-calendar-retry'))
    await waitFor(() =>
      expect(screen.getByTestId('my-calendar-grid')).toBeTruthy(),
    )
  })
})
