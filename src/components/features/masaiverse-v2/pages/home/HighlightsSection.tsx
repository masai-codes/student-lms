import { HIGHLIGHTS_DUMMY_DATA } from '../../data/highlightsDummyData'
import HighlightCard from './HighlightCard'
import SectionHeader from './SectionHeader'

export default function HighlightsSection() {
  return (
    <section>
      <SectionHeader title="Last Week's Highlights" subtitle="recap & replays" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {HIGHLIGHTS_DUMMY_DATA.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>
    </section>
  )
}
