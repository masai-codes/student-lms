import { useQuery } from '@tanstack/react-query'
import HighlightsCarousel from './HighlightsCarousel'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

export default function HighlightsSection() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const highlights = data?.highlights ?? []

  return (
    <section>
      <SectionHeader title="Past Events" subtitle="recap & replays" />
      <HighlightsCarousel
        highlights={highlights}
        isPending={isPending}
        loadingLabel="Loading past events"
        emptyMessage="No past events yet."
      />
    </section>
  )
}
