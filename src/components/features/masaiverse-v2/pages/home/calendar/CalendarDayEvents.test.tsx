// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CalendarDayEvents from './CalendarDayEvents'

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
    expect(screen.getByText('Jun 5 · 3:30 PM')).toBeTruthy()
    // Missing start time falls back to a placeholder.
    expect(screen.getByText('Time TBA')).toBeTruthy()
  })
})
