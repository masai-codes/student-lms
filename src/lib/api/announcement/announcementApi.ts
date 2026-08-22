import { fetchJson } from '@/lib/api/fetchJson'
import { ANNOUNCEMENT_API, MESSAGE_API } from '@/lib/api/announcementPaths'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

export interface FetchAnnouncementsParams {
  page: number
  limit: number
  q?: string
  message?: boolean
  /** Selected announcement types (e.g. `critical`, `info`). */
  types?: Array<string>
  /** Selected announcement categories. */
  categories?: Array<string>
  /** Selected author user ids. */
  announcedBy?: Array<string>
  /** Announced-date range bounds (ISO `yyyy-mm-dd`). */
  startDate?: string
  endDate?: string
}

interface AnnouncerOption {
  id: string
  name: string
}

export interface AnnouncementFilterOptionsResult {
  categories: Array<string>
  announcers: Array<AnnouncerOption>
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
  if (params.types && params.types.length > 0)
    search.set('type', params.types.join(','))
  if (params.categories && params.categories.length > 0)
    search.set('category', params.categories.join(','))
  if (params.announcedBy && params.announcedBy.length > 0)
    search.set('announcedBy', params.announcedBy.join(','))
  if (params.startDate) search.set('startDate', params.startDate)
  if (params.endDate) search.set('endDate', params.endDate)

  return fetchJson<FetchAnnouncementsResult>(
    `${ANNOUNCEMENT_API.list}?${search.toString()}`,
  )
}

export async function fetchAnnouncementFilterOptions(): Promise<AnnouncementFilterOptionsResult> {
  return fetchJson<AnnouncementFilterOptionsResult>(
    ANNOUNCEMENT_API.filterOptions,
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
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markRead(id), {
    method: 'POST',
  })
}

export async function markAnnouncementUnread(id: number): Promise<void> {
  await fetchJson<{ ok: boolean }>(ANNOUNCEMENT_API.markUnread(id), {
    method: 'POST',
  })
}

// Message ids are BigInt and can exceed Number.MAX_SAFE_INTEGER — keep them as
// strings end-to-end so we never lose precision round-tripping through Number.
export async function markMessageRead(id: string): Promise<void> {
  await fetchJson<{ ok: boolean }>(MESSAGE_API.markRead(id), { method: 'POST' })
}

export async function markMessageUnread(id: string): Promise<void> {
  await fetchJson<{ ok: boolean }>(MESSAGE_API.markUnread(id), {
    method: 'POST',
  })
}

export async function fetchAnnouncementUnreadCount(): Promise<number> {
  const { count } = await fetchJson<{ count: number }>(
    ANNOUNCEMENT_API.unreadCount,
  )
  return count
}

export async function fetchAnnouncementPopups(): Promise<PopupItem[]> {
  const { popups } = await fetchJson<{ popups: PopupItem[] }>(
    ANNOUNCEMENT_API.popups,
  )
  return popups
}
