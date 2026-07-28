import { ANNOUNCEMENTS_PER_PAGE } from '@/components/features/announcements/announcementsConfig'
import { isIsoDate } from '@/lib/isIsoDate'

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseDate(value: string | null): string | undefined {
  return value && isIsoDate(value) ? value : undefined
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
  /** Selected author user ids (as strings); empty = no filter. */
  announcedBy: Array<string>
  /** Announced-date range (IST calendar day), each bound optional. */
  startDate?: string
  endDate?: string
}

export function parseAnnouncementsQuery(url: URL): AnnouncementsQueryParams {
  const params = url.searchParams
  const page = parsePositiveInt(params.get('page')) ?? 1
  const limit = parsePositiveInt(params.get('limit')) ?? ANNOUNCEMENTS_PER_PAGE
  const q = params.get('q')?.trim() || undefined
  const messagesOnly = params.get('message') === 'true'
  const types = parseCsv(params.get('type'))
  const categories = parseCsv(params.get('category'))
  const announcedBy = parseCsv(params.get('announcedBy'))
  const startDate = parseDate(params.get('startDate'))
  const endDate = parseDate(params.get('endDate'))
  return {
    page,
    limit,
    q,
    messagesOnly,
    types,
    categories,
    announcedBy,
    startDate,
    endDate,
  }
}
