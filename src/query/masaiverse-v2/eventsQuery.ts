import {
  fetchMasaiverseV2EventDetail,
  fetchMasaiverseV2Events,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'

/** Query options for the community-wide events listing page. */
export const masaiverseV2EventsQuery = () => ({
  queryKey: ['masaiverse-v2', 'events'] as const,
  queryFn: fetchMasaiverseV2Events,
  staleTime: 5 * 60 * 1000,
})

/** Query options for a single event's detail / registration page. */
export const masaiverseV2EventDetailQuery = (eventId: string) => ({
  queryKey: ['masaiverse-v2', 'event', eventId] as const,
  queryFn: () => fetchMasaiverseV2EventDetail(eventId),
  staleTime: 5 * 60 * 1000,
})
