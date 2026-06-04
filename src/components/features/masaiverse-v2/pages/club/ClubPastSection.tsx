import { useQuery } from '@tanstack/react-query'
import HighlightsCarousel from '../home/HighlightsCarousel'
import SectionHeader from '../home/SectionHeader'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'

type ClubPastSectionProps = {
  clubId: string
}

/** Club page's past events — reuses the home highlights carousel. */
export default function ClubPastSection({ clubId }: ClubPastSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2ClubEventsQuery(clubId))
  const highlights = data?.past ?? []

  return (
    <section>
      <SectionHeader title="Past Events" subtitle="recap & replays" />
      <HighlightsCarousel
        highlights={highlights}
        isPending={isPending}
        loadingLabel="Loading past events"
        emptyMessage="No past events yet."
        navKey="club-highlights"
      />
    </section>
  )
}
