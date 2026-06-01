import { ANNOUNCEMENTS_PER_PAGE } from '@/components/features/announcements/announcementsConfig'

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export interface AnnouncementsQueryParams {
  page: number
  limit: number
  q?: string
}

export function parseAnnouncementsQuery(url: URL): AnnouncementsQueryParams {
  const page = parsePositiveInt(url.searchParams.get('page')) ?? 1
  const limit = parsePositiveInt(url.searchParams.get('limit')) ?? ANNOUNCEMENTS_PER_PAGE
  const q = url.searchParams.get('q')?.trim() || undefined
  return { page, limit, q }
}
