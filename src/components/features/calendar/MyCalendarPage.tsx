import { useMemo, useState } from 'react'
import { Calendar } from 'react-big-calendar'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-rbc.css'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'
import type {
  CalendarRouteSearch,
  CalendarView,
} from '@/lib/calendar/calendarSearch'
import type { MyCalendarEvent } from '@/lib/calendar/calendarEventMapping'
import { CalendarEventChip } from './CalendarEventChip'
import { CalendarToolbar } from './CalendarToolbar'
import { EventDetailsModal } from './EventDetailsModal'
import { SubscribeCalendarButton } from './SubscribeCalendarButton'
import {
  CalendarEmptyState,
  CalendarErrorState,
  CalendarSkeleton,
} from './CalendarStates'
import { calendarLocalizer } from './calendarLocalizer'
import { calendarEntityEvent, pushCalendarEvent } from './calendarAnalytics'
import { DEFAULT_CALENDAR_VIEW } from '@/lib/calendar/calendarSearch'
import {
  anchorDay,
  rangeTitle,
  shiftAnchor,
  visibleRange,
} from '@/lib/calendar/calendarRange'
import { mapCalendarEvents } from '@/lib/calendar/calendarEventMapping'
import {
  calendarBatchesQuery,
  calendarEventsQuery,
} from '@/query/calendar/calendarQueries'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'

interface MyCalendarPageProps {
  search: CalendarRouteSearch
  onSearchChange: (next: CalendarRouteSearch) => void
}

export function MyCalendarPage(props: MyCalendarPageProps) {
  const { search, onSearchChange } = props
  const isMobile = useIsMobileViewport()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(
    null,
  )

  const requestedView = search.view ?? DEFAULT_CALENDAR_VIEW
  // Month is desktop-only (parity with the old LMS); fall back to week.
  const view: CalendarView =
    isMobile && requestedView === 'month' ? 'week' : requestedView
  const availableViews: Array<CalendarView> = isMobile
    ? ['week', 'day']
    : ['month', 'week', 'day']

  const range = useMemo(
    () => visibleRange(view, search.date),
    [view, search.date],
  )

  const eventsQuery = useQuery({
    ...calendarEventsQuery({ ...range, batchId: search.batchId }),
    placeholderData: keepPreviousData,
  })
  const batchesQuery = useQuery(calendarBatchesQuery())

  const events = useMemo(
    () => mapCalendarEvents(eventsQuery.data?.events ?? []),
    [eventsQuery.data],
  )

  const patchSearch = (patch: Partial<CalendarRouteSearch>) => {
    const next = { ...search, ...patch }
    // Defaults stay out of the URL.
    if (next.view === DEFAULT_CALENDAR_VIEW) next.view = undefined
    if (next.date === dayjs().format('YYYY-MM-DD')) next.date = undefined
    onSearchChange(next)
  }

  const handleNavigate = (action: 'today' | 'prev' | 'next') => {
    if (action === 'today') return patchSearch({ date: undefined })
    patchSearch({
      date: shiftAnchor(view, search.date, action === 'next' ? 1 : -1),
    })
  }

  const handleSelectEvent = (event: MyCalendarEvent) => {
    pushCalendarEvent(
      calendarEntityEvent(
        event.resource.type,
        'event_click',
        event.resource.id,
      ),
      { title: event.resource.title, view },
    )
    setSelectedEvent(event.resource)
  }

  if (eventsQuery.isPending && !eventsQuery.data) {
    return (
      <section data-testid="my-calendar-page" className="py-4">
        <CalendarSkeleton />
      </section>
    )
  }

  return (
    <section data-testid="my-calendar-page" className="space-y-3 py-4">
      <CalendarToolbar
        title={rangeTitle(view, search.date)}
        view={view}
        availableViews={availableViews}
        onViewChange={(nextView) => patchSearch({ view: nextView })}
        onNavigate={handleNavigate}
        batches={batchesQuery.data?.batches ?? []}
        batchId={search.batchId}
        onBatchChange={(batchId) => patchSearch({ batchId })}
      >
        <SubscribeCalendarButton />
      </CalendarToolbar>

      {eventsQuery.isError ? (
        <CalendarErrorState onRetry={() => void eventsQuery.refetch()} />
      ) : (
        <div className="relative">
          {events.length === 0 && !eventsQuery.isFetching ? (
            <CalendarEmptyState />
          ) : null}
          <div
            data-testid="my-calendar-grid"
            className={`my-calendar animate-dash-rise h-[70vh] min-h-[540px] transition-opacity duration-200 ${
              eventsQuery.isFetching ? 'opacity-70' : 'opacity-100'
            }`}
          >
            <Calendar<MyCalendarEvent>
              localizer={calendarLocalizer}
              events={events}
              date={anchorDay(search.date).toDate()}
              view={view}
              views={availableViews}
              onNavigate={(date) =>
                patchSearch({ date: dayjs(date).format('YYYY-MM-DD') })
              }
              onView={(nextView) =>
                patchSearch({ view: nextView as CalendarView })
              }
              // One combined patch — RBC otherwise fires onNavigate + onView
              // back-to-back and the second would clobber the first (both
              // build from the same pre-click search).
              onDrillDown={(date, nextView) =>
                patchSearch({
                  date: dayjs(date).format('YYYY-MM-DD'),
                  view: nextView as CalendarView,
                })
              }
              onSelectEvent={handleSelectEvent}
              eventPropGetter={(event) => ({
                className: `my-cal-${event.resource.type}`,
              })}
              components={{ toolbar: () => null, event: CalendarEventChip }}
              popup
              messages={{ showMore: (total) => `+${total} more` }}
              scrollToTime={dayjs().hour(8).minute(0).second(0).toDate()}
              culture="en"
            />
          </div>
        </div>
      )}

      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </section>
  )
}
