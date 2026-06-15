import { fetchMasaiverseV2AdminMode } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export const MASAIVERSE_V2_ADMIN_MODE_KEY = [
  'masaiverse-v2',
  'admin-mode',
] as const

/** Query options for the current user's Masaiverse admin-mode state. */
export const masaiverseV2AdminModeQuery = () => ({
  queryKey: MASAIVERSE_V2_ADMIN_MODE_KEY,
  queryFn: fetchMasaiverseV2AdminMode,
  staleTime: 5 * 60 * 1000,
})
