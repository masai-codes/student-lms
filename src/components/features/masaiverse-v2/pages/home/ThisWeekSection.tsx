import { Link } from '@tanstack/react-router'
import { THIS_WEEK_EVENTS_DUMMY_DATA } from '../../data/thisWeekEventsDummyData'
import EventCard from './EventCard'
import SectionHeader from './SectionHeader'

export default function ThisWeekSection() {
  return (
    <section>
      <SectionHeader
        title="This Week on MasaiVerse"
        subtitle="· 2 events live or upcoming"
        action={
          <Link
            to="/masaiverse/events"
            search={(prev) => prev}
            className="text-[14px] font-medium text-[#EF8833] hover:underline"
          >
            View calendar →
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THIS_WEEK_EVENTS_DUMMY_DATA.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
