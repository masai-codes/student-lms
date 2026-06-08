import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CalendarDayEvents from './CalendarDayEvents'
import GlobalLeaders from './GlobalLeaders'
import ReadOnlyCalendar from './ReadOnlyCalendar'
import UpcomingEvents from './UpcomingEvents'
import { buildEventsByDate } from './calendarUtils'
import { masaiverseV2EventsQuery } from '@/query/masaiverse-v2/eventsQuery'

/**
 * Drawer content for "View calendar": an interactive month calendar (dots on
 * days with events; click a day to see its events), the upcoming-events list,
 * and the global leaderboard. The calendar and day list are driven by the
 * member-visible events feed (public events + the member's clubs).
 */
export default function CalendarPanel() {
  const { data } = useQuery(masaiverseV2EventsQuery())
  const events = data ?? []
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const eventsByDate = useMemo(
    () => buildEventsByDate(events),
    [events],
  )
  const eventDateKeys = useMemo(
    () => new Set(eventsByDate.keys()),
    [eventsByDate],
  )
  const selectedDayEvents = selectedDateKey
    ? (eventsByDate.get(selectedDateKey) ?? [])
    : []

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <ReadOnlyCalendar
          eventDateKeys={eventDateKeys}
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
        />
        <CalendarDayEvents
          dateKey={selectedDateKey}
          events={selectedDayEvents}
        />
      </div>
      <UpcomingEvents />
      <div className="h-px bg-[#EDEAE8]" />
      <GlobalLeaders />
    </div>
  )
}
