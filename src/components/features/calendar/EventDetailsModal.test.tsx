// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'

import { EventDetailsModal } from './EventDetailsModal'

const hoisted = vi.hoisted(() => ({
  pushGtmEvent: vi.fn(),
  joinCta: vi.fn(() => <button type="button">Join live</button>),
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))
vi.mock(
  '@/components/features/learn/section-three/content-card/LearnListingJoinLiveCta',
  () => ({ LearnListingJoinLiveCta: hoisted.joinCta }),
)

const dto = (over: Partial<CalendarEventDto> = {}): CalendarEventDto => ({
  id: 7,
  type: 'lecture',
  title: 'DSA Session',
  schedule: '2026-08-14T10:00:00+05:30',
  concludes: '2026-08-14T12:00:00+05:30',
  effectiveEnd: '2026-08-14T12:00:00+05:30',
  optional: false,
  sectionId: 5,
  sectionName: 'Section A',
  batchName: 'FS Batch',
  hostName: 'Prof. A',
  detailPath: '/lectures/7',
  joinLive: {
    state: 'active',
    joinZoomLink: 'https://zoom.us/j/1',
    isNewZoomRedirection: false,
    enableZoomWebView: false,
  },
  ...over,
})

describe('EventDetailsModal', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders nothing without an event', () => {
    const { container } = render(
      <EventDetailsModal event={null} onClose={vi.fn()} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows title, type badge, time, host and batch', () => {
    render(<EventDetailsModal event={dto()} onClose={vi.fn()} />)
    expect(
      screen.getByTestId('my-calendar-event-modal-title').textContent,
    ).toBe('DSA Session')
    expect(
      screen.getByTestId('my-calendar-event-modal-type').textContent,
    ).toContain('Lecture')
    expect(
      screen.getByTestId('my-calendar-event-modal-host').textContent,
    ).toContain('Prof. A')
    expect(
      screen.getByTestId('my-calendar-event-modal-batch').textContent,
    ).toBe('FS Batch · Section A')
  })

  it('links to the detail page and tracks the click', () => {
    render(<EventDetailsModal event={dto()} onClose={vi.fn()} />)
    const link = screen.getByTestId('my-calendar-event-modal-details-link')
    expect(link.getAttribute('href')).toBe('/lectures/7')
    link.click()
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_calendar_lecture_view_details_id_7',
      { title: 'DSA Session' },
    )
  })

  it('renders the join CTA only when the event carries joinLive', () => {
    render(<EventDetailsModal event={dto()} onClose={vi.fn()} />)
    expect(screen.getByText('Join live')).toBeTruthy()
    expect(hoisted.joinCta).toHaveBeenCalled()
  })

  it('omits link and join CTA for quizzes, and flags optional events', () => {
    render(
      <EventDetailsModal
        event={dto({
          type: 'quiz',
          detailPath: null,
          joinLive: null,
          hostName: null,
          optional: true,
        })}
        onClose={vi.fn()}
      />,
    )
    expect(
      screen.queryByTestId('my-calendar-event-modal-details-link'),
    ).toBeNull()
    expect(screen.queryByText('Join live')).toBeNull()
    expect(
      screen.getByTestId('my-calendar-event-modal-type').textContent,
    ).toContain('Quiz · Optional')
  })
})
