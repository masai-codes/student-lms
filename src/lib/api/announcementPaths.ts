export const ANNOUNCEMENT_API = {
  list: '/api/announcement',
  detail: (id: number | string, source: 'a' | 'm' = 'a') =>
    `/api/announcement/${id}${source === 'm' ? '?src=m' : ''}`,
  markRead: (id: number | string, source: 'a' | 'm' = 'a') =>
    `/api/announcement/${id}/mark-read${source === 'm' ? '?src=m' : ''}`,
  markUnread: (id: number | string, source: 'a' | 'm' = 'a') =>
    `/api/announcement/${id}/mark-unread${source === 'm' ? '?src=m' : ''}`,
  addBookmark: (entityId: number | string) => `/api/announcement/${entityId}/bookmark`,
  removeBookmark: (bookmarkId: number | string) => `/api/announcement/${bookmarkId}/bookmark`,
} as const
