import { useQuery } from '@tanstack/react-query'
import EventsCarousel from '../home/EventsCarousel'
import SectionHeader from '../home/SectionHeader'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'

type ClubUpcomingSectionProps = {
  clubId: string
  /** Opens the calendar drawer. */
  onViewCalendar?: () => void
}

/** Club page's live/upcoming events — reuses the home events carousel. */
export default function ClubUpcomingSection({
  clubId,
  onViewCalendar,
}: ClubUpcomingSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2ClubEventsQuery(clubId))
  const events = data?.upcoming ?? []

  return (
    <section>
      <SectionHeader
        title="Live & Upcoming"
        subtitle={
          events.length
            ? `· ${events.length} event${events.length === 1 ? '' : 's'}`
            : undefined
        }
        action={
          <button
            type="button"
            onClick={onViewCalendar}
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            View calendar →
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
