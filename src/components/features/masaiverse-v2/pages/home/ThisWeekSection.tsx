import { useQuery } from '@tanstack/react-query'
import EventsCarousel from './EventsCarousel'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import { useServerTime } from '@/hooks/useServerTime'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type ThisWeekSectionProps = {
  onViewCalendar: () => void
}

export default function ThisWeekSection({
  onViewCalendar,
}: ThisWeekSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const events = data?.events ?? []
  const { skewMs } = useServerTime()

  return (
    <section>
      <SectionHeader
        title="Live & Upcoming"
        subtitle={
          events.length
            ? `· ${events.length} event${events.length === 1 ? '' : 's'} live or upcoming`
            : undefined
        }
        action={
          <button
            type="button"
            onClick={() => {
              trackMasaiverse(MASAIVERSE_EVENTS.calendarOpen, {
                source: 'home_this_week',
              })
              onViewCalendar()
            }}
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
        skewMs={skewMs}
      />
    </section>
  )
}
