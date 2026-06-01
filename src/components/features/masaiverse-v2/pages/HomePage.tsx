import { useState } from 'react'
import InlineDrawer from '../InlineDrawer'
import ActiveClubsSection from './home/ActiveClubsSection'
import HighlightsSection from './home/HighlightsSection'
import StatsSection from './home/StatsSection'
import ThisWeekSection from './home/ThisWeekSection'
import CalendarPanel from './home/calendar/CalendarPanel'

/**
 * Masaiverse v2 home content. Four sections (stats, this week's events, last
 * week's highlights, active clubs). "View calendar" opens an inline drawer
 * that renders the calendar panel and shrinks the main content.
 */
export default function HomePage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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
      </div>
    </InlineDrawer>
  )
}
