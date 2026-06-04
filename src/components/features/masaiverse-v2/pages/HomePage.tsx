import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import InlineDrawer from '../InlineDrawer'
import ActiveClubsSection from './home/ActiveClubsSection'
import CommunityDiscussionsSection from './home/CommunityDiscussionsSection'
import HighlightsSection from './home/HighlightsSection'
import StatsSection from './home/StatsSection'
import ThisWeekSection from './home/ThisWeekSection'
import CalendarPanel from './home/calendar/CalendarPanel'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

/**
 * Masaiverse v2 home content. Sections: stats, live & upcoming events, past
 * events, active clubs, and community discussions. "View calendar" opens an
 * inline drawer that renders the calendar panel and shrinks the main content.
 */
export default function HomePage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  // The home payload carries the latest discussions, so the section renders
  // from this one request rather than fetching its own paginated feed.
  const { data: home, isPending: isHomePending } = useQuery(
    masaiverseV2HomeQuery(),
  )

  return (
    <InlineDrawer
      open={isCalendarOpen}
      panel={<CalendarPanel />}
      onClose={() => setIsCalendarOpen(false)}
    >
      <div className="flex flex-col gap-8">
        <StatsSection />
        <ThisWeekSection
          onViewCalendar={() => setIsCalendarOpen((open) => !open)}
        />
        <HighlightsSection />
        <ActiveClubsSection />
        <CommunityDiscussionsSection
          preloadedDiscussions={home?.discussions}
          preloadedLoading={isHomePending}
        />
      </div>
    </InlineDrawer>
  )
}
