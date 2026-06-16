import { fetchMasaiverseV2Banners } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { MASAIVERSE_V2_REFETCH_ON_NAV } from '@/query/masaiverse-v2/queryDefaults'

export const MASAIVERSE_V2_BANNERS_KEY = ['masaiverse-v2', 'banners'] as const

/** Query options for the home-page banners. */
export const masaiverseV2BannersQuery = () => ({
  queryKey: MASAIVERSE_V2_BANNERS_KEY,
  queryFn: fetchMasaiverseV2Banners,
  staleTime: 5 * 60 * 1000,
  ...MASAIVERSE_V2_REFETCH_ON_NAV,
})
