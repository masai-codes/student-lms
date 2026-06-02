export const WHATS_NEW_API = {
  list: '/api/whats-new',
  detail: (id: number | string) => `/api/whats-new/${id}`,
} as const
