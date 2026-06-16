import {
  fetchMasaiverseV2EventDetail,
  fetchMasaiverseV2EventEditData,
  fetchMasaiverseV2Events,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { MASAIVERSE_V2_REFETCH_ON_NAV } from '@/query/masaiverse-v2/queryDefaults'

/** Query options for the community-wide events listing page. */
export const masaiverseV2EventsQuery = () => ({
  queryKey: ['masaiverse-v2', 'events'] as const,
  queryFn: fetchMasaiverseV2Events,
  staleTime: 5 * 60 * 1000,
  ...MASAIVERSE_V2_REFETCH_ON_NAV,
})

/** Query options for a single event's detail / registration page. */
export const masaiverseV2EventDetailQuery = (eventId: string) => ({
  queryKey: ['masaiverse-v2', 'event', eventId] as const,
  queryFn: () => fetchMasaiverseV2EventDetail(eventId),
  staleTime: 5 * 60 * 1000,
  ...MASAIVERSE_V2_REFETCH_ON_NAV,
})

/** Query options for the admin event edit drawer (raw columns + meta). */
export const masaiverseV2EventEditDataQuery = (eventId: string) => ({
  queryKey: ['masaiverse-v2', 'event', eventId, 'edit-data'] as const,
  queryFn: () => fetchMasaiverseV2EventEditData(eventId),
  staleTime: 0,
})
