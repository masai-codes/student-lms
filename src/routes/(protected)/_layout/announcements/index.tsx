import { createFileRoute } from '@tanstack/react-router'
import { AnnouncementsPage } from '@/components/features/announcements/AnnouncementsPage'

type AnnouncementsSearch = {
  q?: string
  page: number
  message?: boolean
}

export const Route = createFileRoute('/(protected)/_layout/announcements/')({
  validateSearch: (raw): AnnouncementsSearch => {
    const q = typeof raw.q === 'string' && raw.q.length > 0 ? raw.q : undefined

    const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

    const message =
      raw.message === true || raw.message === 'true' ? true : undefined

    return { q, page, message }
  },
  component: AnnouncementsPage,
})
