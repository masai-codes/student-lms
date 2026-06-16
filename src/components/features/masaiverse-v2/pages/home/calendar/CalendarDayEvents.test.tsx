// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendarDayEvents from './CalendarDayEvents'
import type { ReactNode } from 'react'

// Pin the timezone so the viewer-local time renders deterministically.
// Asia/Kolkata → getTzLabel() === 'IST'.
process.env.TZ = 'Asia/Kolkata'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    className,
  }: {
    children: ReactNode
    params?: { eventId?: string }
    className?: string
  }) => (
    <a href="#" data-event-id={params?.eventId} className={className}>
      {children}
    </a>
  ),
}))

afterEach(cleanup)

describe('CalendarDayEvents', () => {
  it('renders nothing until a day is selected', () => {
    const { container } = render(
      <CalendarDayEvents dateKey={null} events={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows an empty line for a selected day with no events', () => {
    render(<CalendarDayEvents dateKey="2026-06-05" events={[]} />)
    expect(screen.getByText('Fri 5 June')).toBeTruthy()
    expect(screen.getByText('No events on this day.')).toBeTruthy()
  })

  it('lists the day events with time and a club badge', () => {
    render(
      <CalendarDayEvents
        dateKey="2026-06-05"
        events={[
          {
            id: 'a',
            title: 'Build Sprint',
            startTime: '2026-06-05T10:00:00Z',
            clubName: 'Code Club',
          },
          {
            id: 'b',
            title: 'Community Webinar',
            startTime: null,
            clubName: null,
          },
        ]}
      />,
    )
    expect(screen.getByText('Build Sprint')).toBeTruthy()
    expect(screen.getByText('Code Club')).toBeTruthy()
    // 10:00 UTC → 3:30 PM IST.
    expect(screen.getByText('Jun 5 · 3:30 PM (IST)')).toBeTruthy()
    // Missing start time falls back to a placeholder.
    expect(screen.getByText('Time TBA')).toBeTruthy()
  })

  it('links each day event to its detail route', () => {
    render(
      <CalendarDayEvents
        dateKey="2026-06-05"
        events={[
          {
            id: 'a',
            title: 'Build Sprint',
            startTime: '2026-06-05T10:00:00Z',
            clubName: 'Code Club',
          },
        ]}
      />,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('data-event-id')).toBe('a')
  })
})
