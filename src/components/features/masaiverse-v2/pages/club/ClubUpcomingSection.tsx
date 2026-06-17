import { useQuery } from '@tanstack/react-query'
import EventsCarousel from '../home/EventsCarousel'
import SectionHeader from '../home/SectionHeader'
import type { MasaiverseV2ClubEvents } from '@/server/api/masaiverse-v2/services/getClubEvents.service'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type ClubUpcomingSectionProps = {
  clubId: string
  /** Toggles the calendar drawer. */
  onViewCalendar?: () => void
  /** Whether the calendar drawer is currently open (toggles the CTA label). */
  calendarOpen?: boolean
  /** Events embedded in the club detail payload; seeds the query. */
  initialEvents?: MasaiverseV2ClubEvents
}

/** Club page's live/upcoming events — reuses the home events carousel. */
export default function ClubUpcomingSection({
  clubId,
  onViewCalendar,
  calendarOpen = false,
  initialEvents,
}: ClubUpcomingSectionProps) {
  const { data, isPending } = useQuery({
    ...masaiverseV2ClubEventsQuery(clubId),
    ...(initialEvents ? { initialData: initialEvents } : {}),
  })
  const events = data?.upcoming ?? []

  return (
    <section>
      <SectionHeader
        title="Live & Upcoming Events"
        subtitle={
          events.length
            ? `· ${events.length} event${events.length === 1 ? '' : 's'}`
            : undefined
        }
        action={
          <button
            type="button"
            onClick={() => {
              trackMasaiverse(MASAIVERSE_EVENTS.calendarOpen, {
                source: 'club_upcoming',
                club_id: clubId,
              })
              onViewCalendar?.()
            }}
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            {calendarOpen ? 'Hide calendar →' : 'View calendar →'}
          </button>
        }
      />
      <EventsCarousel
        events={events}
        isPending={isPending}
        loadingLabel="Loading events"
        emptyMessage="No live or upcoming events right now."
        navKey="club-events"
      />
    </section>
  )
}
