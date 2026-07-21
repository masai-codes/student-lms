import { fetchJson } from '@/lib/api/fetchJson'
import { WHATS_NEW_API } from '@/lib/api/whatsNewPaths'
import type { WhatsNewItem } from '@/server/api/whats-new/getWhatsNew.service'
import type { WhatsNewDetail } from '@/server/api/whats-new/getWhatsNewById.service'

export interface FetchWhatsNewResult {
  items: Array<WhatsNewItem>
  total: number
}

export async function fetchWhatsNew(
  page: number,
): Promise<FetchWhatsNewResult> {
  const search = new URLSearchParams({ page: String(page) })
  return fetchJson<FetchWhatsNewResult>(
    `${WHATS_NEW_API.list}?${search.toString()}`,
  )
}

export async function fetchWhatsNewById(
  id: number | string,
): Promise<WhatsNewDetail> {
  const { item } = await fetchJson<{ item: WhatsNewDetail }>(
    WHATS_NEW_API.detail(id),
  )
  return item
}
