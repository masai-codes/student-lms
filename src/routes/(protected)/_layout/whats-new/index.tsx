import { createFileRoute } from '@tanstack/react-router'
import { WhatsNewPage } from '@/components/features/whats-new/WhatsNewPage'

type WhatsNewSearch = {
  page: number
}

export const Route = createFileRoute('/(protected)/_layout/whats-new/')({
  validateSearch: (raw): WhatsNewSearch => {
    const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
    return { page }
  },
  component: WhatsNewPage,
})
