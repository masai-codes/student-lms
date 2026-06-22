import { fetchJson } from '@/lib/api/fetchJson'
import { ANNOUNCEMENT_API, MESSAGE_API } from '@/lib/api/announcementPaths'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

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

export async function markAnnouncementRead(id: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markRead(id), { method: 'POST' })
}

export async function markAnnouncementUnread(id: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markUnread(id), { method: 'POST' })
}

export async function markMessageRead(id: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(MESSAGE_API.markRead(id), { method: 'POST' })
}

export async function markMessageUnread(id: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(MESSAGE_API.markUnread(id), { method: 'POST' })
}

export async function fetchAnnouncementUnreadCount(): Promise<number> {
  const { count } = await fetchJson<{ count: number }>(ANNOUNCEMENT_API.unreadCount)
  return count
}

export async function fetchAnnouncementPopups(): Promise<PopupItem[]> {
  const { popups } = await fetchJson<{ popups: PopupItem[] }>(ANNOUNCEMENT_API.popups)
  return popups
}

export async function fetchAnnouncementById(id: number | string): Promise<AnnouncementDetail> {
  const { announcement } = await fetchJson<{ announcement: AnnouncementDetail }>(
    ANNOUNCEMENT_API.detail(id),
  )
  return announcement
}
