import { fetchJson } from '@/lib/api/fetchJson'
import { ANNOUNCEMENT_API } from '@/lib/api/announcementPaths'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'

export interface FetchAnnouncementsParams {
  page: number
  limit: number
  q?: string
  message?: boolean
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
  if (params.message) search.set('message', 'true')

  return fetchJson<FetchAnnouncementsResult>(
    `${ANNOUNCEMENT_API.list}?${search.toString()}`,
  )
}

export async function addBookmark(entityId: number): Promise<number> {
  const { bookmarkId } = await fetchJson<{ bookmarkId: number }>(
    ANNOUNCEMENT_API.addBookmark(entityId),
    { method: 'POST' },
  )
  return bookmarkId
}

export async function removeBookmark(bookmarkId: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(
    ANNOUNCEMENT_API.removeBookmark(bookmarkId),
    { method: 'DELETE' },
  )
}

export async function markAnnouncementRead(
  id: number,
  source: 'a' | 'm' = 'a',
): Promise<void> {
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markRead(id, source), { method: 'POST' })
}

export async function markAnnouncementUnread(
  id: number,
  source: 'a' | 'm' = 'a',
): Promise<void> {
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markUnread(id, source), { method: 'POST' })
}

export async function fetchAnnouncementById(
  id: number | string,
  source: 'a' | 'm' = 'a',
): Promise<AnnouncementDetail> {
  const { announcement } = await fetchJson<{ announcement: AnnouncementDetail }>(
    ANNOUNCEMENT_API.detail(id, source),
  )
  return announcement
}
