import { createFileRoute } from '@tanstack/react-router'
import { AnnouncementsPage } from '@/components/features/announcements/AnnouncementsPage'
import {
  isIsoDate,
  normalizeFilterValues,
} from '@/components/features/announcements/announcementFilterConfig'

type AnnouncementsSearch = {
  q?: string
  page: number
  message?: boolean
  type?: Array<string>
  category?: Array<string>
  announcedBy?: Array<string>
  startDate?: string
  endDate?: string
}

function arrayOrUndefined(raw: unknown): Array<string> | undefined {
  const values = normalizeFilterValues(raw)
  return values.length > 0 ? values : undefined
}

function dateOrUndefined(raw: unknown): string | undefined {
  return typeof raw === 'string' && isIsoDate(raw) ? raw : undefined
}

export const Route = createFileRoute('/(protected)/_layout/announcements/')({
  validateSearch: (raw): AnnouncementsSearch => {
    const q = typeof raw.q === 'string' && raw.q.length > 0 ? raw.q : undefined

    const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

    const message =
      raw.message === true || raw.message === 'true' ? true : undefined

    return {
      q,
      page,
      message,
      type: arrayOrUndefined(raw.type),
      category: arrayOrUndefined(raw.category),
      announcedBy: arrayOrUndefined(raw.announcedBy),
      startDate: dateOrUndefined(raw.startDate),
      endDate: dateOrUndefined(raw.endDate),
    }
  },
  component: AnnouncementsPage,
})
