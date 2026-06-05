import { fetchMasaiverseV2Home } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export const MASAIVERSE_V2_HOME_KEY = ['masaiverse-v2', 'home'] as const

/** Query options for the single aggregated Masaiverse v2 home payload. */
export const masaiverseV2HomeQuery = () => ({
  queryKey: MASAIVERSE_V2_HOME_KEY,
  queryFn: fetchMasaiverseV2Home,
  staleTime: 5 * 60 * 1000,
})
