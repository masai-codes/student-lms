import { ANNOUNCEMENTS_PER_PAGE } from '@/components/features/announcements/announcementsConfig'

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Parse a comma-separated multi-value filter param into a deduped, trimmed list. */
function parseCsv(value: string | null): Array<string> {
  if (!value) return []
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ]
}

export interface AnnouncementsQueryParams {
  page: number
  limit: number
  q?: string
  messagesOnly: boolean
  /** Selected announcement types (e.g. `critical`, `info`); empty = no filter. */
  types: Array<string>
  /** Selected announcement categories; empty = no filter. */
  categories: Array<string>
}

export function parseAnnouncementsQuery(url: URL): AnnouncementsQueryParams {
  const page = parsePositiveInt(url.searchParams.get('page')) ?? 1
  const limit =
    parsePositiveInt(url.searchParams.get('limit')) ?? ANNOUNCEMENTS_PER_PAGE
  const q = url.searchParams.get('q')?.trim() || undefined
  const messagesOnly = url.searchParams.get('message') === 'true'
  const types = parseCsv(url.searchParams.get('type'))
  const categories = parseCsv(url.searchParams.get('category'))
  return { page, limit, q, messagesOnly, types, categories }
}
