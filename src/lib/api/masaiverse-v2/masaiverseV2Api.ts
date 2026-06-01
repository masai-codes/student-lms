import type { MasaiverseV2HomeData } from '@/server/api/masaiverse-v2/getMasaiverseV2Home.service'
import { fetchJson } from '@/lib/api/fetchJson'
import { MASAIVERSE_V2_API } from '@/lib/api/masaiverse-v2/masaiverseV2Paths'

export async function fetchMasaiverseV2Home(): Promise<MasaiverseV2HomeData> {
  return fetchJson<MasaiverseV2HomeData>(MASAIVERSE_V2_API.home)
}
