export const ANNOUNCEMENT_API = {
  list: '/api/announcement',
  detail: (id: number | string) => `/api/announcement/${id}`,
} as const
