// A SEPARATE dayjs instance (dayjs/esm is a distinct module from 'dayjs'),
// deliberately WITHOUT the app-wide utc/timezone plugins: react-big-calendar's
// dayjsLocalizer silently switches to `dayjs.tz`-based arithmetic when it sees
// the timezone plugin (which src/utils/timeZoneHandler loads globally), and
// that path anchors the day grid to UTC midnight — for an IST viewer every
// time-gutter slot shifts by 5:30 (labels read "6:30 PM" at midnight). The
// plain instance keeps the localizer in local-time arithmetic, which is
// correct because our events carry absolute instants. Regression-tested in
// calendarLocalizer.test.tsx.
import dayjsPlain from 'dayjs/esm'
import { dayjsLocalizer } from 'react-big-calendar'

export const calendarLocalizer = dayjsLocalizer(dayjsPlain)

interface SortableEvent {
  start: Date
  end: Date
  allDay?: boolean
}

/**
 * Days an event occupies on the grid: start-of-start-day → end ceiled to the
 * NEXT midnight (an event ending 03:20 occupies that whole day cell). The
 * stock localizer truncates this diff instead, so two multi-day events that
 * end on different days can tie and fall back to start-time order — putting
 * the longer bar UNDER the shorter one. The old LMS (react-big-calendar 1.8)
 * ceiled, keeping the furthest-reaching bar on top; this restores that.
 */
function occupiedDaySpan(start: Date, end: Date): number {
  const startDay = dayjsPlain(start).startOf('day')
  const endDjs = dayjsPlain(end)
  const endCeil = endDjs.isSame(endDjs.startOf('day'))
    ? endDjs
    : endDjs.startOf('day').add(1, 'day')
  return Math.max(endCeil.diff(startDay, 'day'), 1)
}

/** Exported for tests; wired onto the localizer below. */
export const sortCalendarEvents = ({
  evtA,
  evtB,
}: {
  evtA: SortableEvent
  evtB: SortableEvent
}): number => {
  const startSort =
    +dayjsPlain(evtA.start).startOf('day').toDate() -
    +dayjsPlain(evtB.start).startOf('day').toDate()
  return (
    startSort || // earlier start day first
    occupiedDaySpan(evtB.start, evtB.end) -
      occupiedDaySpan(evtA.start, evtA.end) || // longer span on top
    Number(!!evtB.allDay) - Number(!!evtA.allDay) || // then all-day singles
    +evtA.start - +evtB.start || // then start time
    +evtA.end - +evtB.end
  )
}

// @types/react-big-calendar declares sortEvents as `(a, b) => boolean`, but
// the runtime (see lib/localizers/dayjs.js) calls it with `{ evtA, evtB }`
// and expects a number — hence the cast.
;(
  calendarLocalizer as unknown as { sortEvents: typeof sortCalendarEvents }
).sortEvents = sortCalendarEvents
