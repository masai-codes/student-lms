import { fetchMasaiverseV2Home } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

/** Query options for the single aggregated Masaiverse v2 home payload. */
export const masaiverseV2HomeQuery = () => ({
  queryKey: ['masaiverse-v2', 'home'] as const,
  queryFn: fetchMasaiverseV2Home,
  staleTime: 5 * 60 * 1000,
})
