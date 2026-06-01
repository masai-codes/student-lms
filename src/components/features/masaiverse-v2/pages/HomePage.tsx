import ActiveClubsSection from './home/ActiveClubsSection'
import HighlightsSection from './home/HighlightsSection'
import StatsSection from './home/StatsSection'
import ThisWeekSection from './home/ThisWeekSection'

/**
 * Masaiverse v2 home content. Four sections, static dummy data for now:
 * stats, this week's events, last week's highlights, and active clubs.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <StatsSection />
      <ThisWeekSection />
      <HighlightsSection />
      <ActiveClubsSection />
    </div>
  )
}
