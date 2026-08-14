// @vitest-environment jsdom
// Import the app-wide dayjs setup FIRST — it loads the timezone plugin onto
// the global 'dayjs' module, which is exactly the condition that used to flip
// react-big-calendar's dayjsLocalizer into its broken UTC-anchored code path.
import '@/utils/timeZoneHandler'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Calendar } from 'react-big-calendar'
import { calendarLocalizer, sortCalendarEvents } from './calendarLocalizer'

describe('calendarLocalizer', () => {
  afterEach(cleanup)

  it('sorts the multi-day event reaching further right on top (old-LMS order)', () => {
    // Same start day; A ends Thu evening, B spills into Fri early morning.
    // The stock localizer's truncating day-diff ties these (both "2 days")
    // and falls back to start time, sinking the longer bar below.
    const evtA = {
      start: new Date(2026, 7, 11, 17, 30),
      end: new Date(2026, 7, 13, 21, 50),
    }
    const evtB = {
      start: new Date(2026, 7, 11, 23, 0),
      end: new Date(2026, 7, 14, 3, 20),
    }
    expect(sortCalendarEvents({ evtA, evtB })).toBeGreaterThan(0) // B first
    expect(sortCalendarEvents({ evtA: evtB, evtB: evtA })).toBeLessThan(0)
    // Different start days still sort by start day regardless of span.
    const wedShort = {
      start: new Date(2026, 7, 12, 9, 0),
      end: new Date(2026, 7, 12, 10, 0),
    }
    expect(
      sortCalendarEvents({ evtA: wedShort, evtB }),
    ).toBeGreaterThan(0)
    // Equal spans fall back to start time.
    const tueLater = {
      start: new Date(2026, 7, 11, 19, 0),
      end: new Date(2026, 7, 13, 21, 0),
    }
    expect(
      sortCalendarEvents({ evtA: tueLater, evtB: evtA }),
    ).toBeGreaterThan(0)
  })

  it('keeps week-view gutter slots on the local hour even with the tz plugin loaded', () => {
    const { container } = render(
      <Calendar
        localizer={calendarLocalizer}
        events={[]}
        date={new Date(2026, 7, 14)}
        view="week"
        views={['week']}
        onNavigate={() => {}}
        onView={() => {}}
        components={{ toolbar: () => null }}
      />,
    )
    const labels = Array.from(
      container.querySelectorAll('.rbc-time-gutter .rbc-label'),
    ).map((node) => node.textContent ?? '')

    expect(labels[0]).toBe('12:00 AM')
    expect(labels.at(-1)).toBe('11:00 PM')
    // Every group boundary lands on the hour — a :30 (or :15) suffix means the
    // localizer regressed to UTC-anchored day math for half-hour timezones.
    for (const label of labels) {
      expect(label).toMatch(/^\d{1,2}:00 (AM|PM)$/)
    }
  })
})
