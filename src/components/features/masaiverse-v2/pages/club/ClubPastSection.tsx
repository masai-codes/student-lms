import { useQuery } from '@tanstack/react-query'
import HighlightsCarousel from '../home/HighlightsCarousel'
import SectionHeader from '../home/SectionHeader'
import type { MasaiverseV2ClubEvents } from '@/server/api/masaiverse-v2/services/getClubEvents.service'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { useServerTime } from '@/hooks/useServerTime'

type ClubPastSectionProps = {
  clubId: string
  /** Events embedded in the club detail payload; seeds the query. */
  initialEvents?: MasaiverseV2ClubEvents
}

/** Club page's past events — reuses the home highlights carousel. */
export default function ClubPastSection({
  clubId,
  initialEvents,
}: ClubPastSectionProps) {
  const { data, isPending } = useQuery({
    ...masaiverseV2ClubEventsQuery(clubId),
    ...(initialEvents ? { initialData: initialEvents } : {}),
  })
  const highlights = data?.past ?? []
  const { skewMs } = useServerTime()

  return (
    <section>
      <SectionHeader title="Past Events" subtitle="recap & replays" />
      <HighlightsCarousel
        highlights={highlights}
        isPending={isPending}
        loadingLabel="Loading past events"
        emptyMessage="No past events yet."
        navKey="club-highlights"
        skewMs={skewMs}
      />
    </section>
  )
}
