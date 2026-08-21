import { createFileRoute } from '@tanstack/react-router'
import type { CalendarRouteSearch } from '@/lib/calendar/calendarSearch'
import { MyCalendarPage } from '@/components/features/calendar/MyCalendarPage'
import { parseCalendarSearch } from '@/lib/calendar/calendarSearch'

export const Route = createFileRoute('/(protected)/_layout/my-calendar/')({
  validateSearch: parseCalendarSearch,
  component: MyCalendarRoute,
})

function MyCalendarRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleSearchChange = (next: CalendarRouteSearch) => {
    void navigate({
      search: {
        view: next.view,
        date: next.date,
        batchId: next.batchId,
      },
    })
  }

  return <MyCalendarPage search={search} onSearchChange={handleSearchChange} />
}
