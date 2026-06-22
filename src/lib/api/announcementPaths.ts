export const ANNOUNCEMENT_API = {
  list: '/api/announcement',
  detail: (id: number | string) => `/api/announcement/${id}`,
  markRead: (id: number | string) => `/api/announcement/${id}/mark-read`,
  markUnread: (id: number | string) => `/api/announcement/${id}/mark-unread`,
  addBookmark: (entityId: number | string) => `/api/announcement/${entityId}/bookmark`,
  removeBookmark: (bookmarkId: number | string) => `/api/announcement/${bookmarkId}/bookmark`,
} as const

export const MESSAGE_API = {
  detail: (id: number | string) => `/api/message/${id}`,
  markRead: (id: number | string) => `/api/message/${id}/mark-read`,
  markUnread: (id: number | string) => `/api/message/${id}/mark-unread`,
} as const
