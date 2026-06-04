import { useQuery } from '@tanstack/react-query'
import HighlightsCarousel from './HighlightsCarousel'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

export default function HighlightsSection() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const highlights = data?.highlights ?? []

  return (
    <section>
      <SectionHeader title="Last Week's Highlights" subtitle="recap & replays" />
      <HighlightsCarousel
        highlights={highlights}
        isPending={isPending}
        loadingLabel="Loading highlights"
        emptyMessage="No highlights from last week."
      />
    </section>
  )
}
