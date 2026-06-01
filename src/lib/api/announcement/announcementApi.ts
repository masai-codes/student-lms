import { fetchJson } from '@/lib/api/fetchJson'
import { ANNOUNCEMENT_API } from '@/lib/api/announcementPaths'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'

export interface FetchAnnouncementsParams {
  page: number
  limit: number
  q?: string
}

export interface FetchAnnouncementsResult {
  announcements: Array<AnnouncementItem>
  total: number
}

export async function fetchAnnouncements(
  params: FetchAnnouncementsParams,
): Promise<FetchAnnouncementsResult> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.q) search.set('q', params.q)

  return fetchJson<FetchAnnouncementsResult>(
    `${ANNOUNCEMENT_API.list}?${search.toString()}`,
  )
}

export async function fetchAnnouncementById(
  id: number | string,
): Promise<AnnouncementDetail> {
  const { announcement } = await fetchJson<{ announcement: AnnouncementDetail }>(
    ANNOUNCEMENT_API.detail(id),
  )
  return announcement
}
