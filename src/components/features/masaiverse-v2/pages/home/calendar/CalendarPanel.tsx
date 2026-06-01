import { useMemo } from 'react'
import ReadOnlyCalendar from './ReadOnlyCalendar'
import ThisMonthLeaders from './ThisMonthLeaders'
import UpcomingEvents from './UpcomingEvents'
import { getDummyEventDateKeys } from './calendarUtils'

/**
 * Drawer content for "View calendar": a read-only month calendar, the list of
 * upcoming events, and this month's leaders.
 */
export default function CalendarPanel() {
  const eventDateKeys = useMemo(
    () => new Set(getDummyEventDateKeys(new Date())),
    [],
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <ReadOnlyCalendar eventDateKeys={eventDateKeys} />
      <UpcomingEvents />
      <div className="h-px bg-[#EDEAE8]" />
      <ThisMonthLeaders />
    </div>
  )
}
