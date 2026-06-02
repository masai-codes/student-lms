import { useQuery } from '@tanstack/react-query'
import EventCard from './EventCard'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

type ThisWeekSectionProps = {
  onViewCalendar: () => void
}

export default function ThisWeekSection({
  onViewCalendar,
}: ThisWeekSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const events = data?.events ?? []

  return (
    <section>
      <SectionHeader
        title="This Week on MasaiVerse"
        subtitle={
          events.length
            ? `· ${events.length} event${events.length === 1 ? '' : 's'} live or upcoming`
            : undefined
        }
        action={
          <button
            type="button"
            onClick={onViewCalendar}
            className="text-[14px] font-medium text-[#EF8833] hover:underline"
          >
            View calendar →
          </button>
        }
      />
      {isPending ? (
        <p className="text-[14px] text-[#6B7280]">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">
          No live or upcoming events right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
