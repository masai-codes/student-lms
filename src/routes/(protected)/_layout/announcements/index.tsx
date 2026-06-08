import { createFileRoute } from '@tanstack/react-router'
import { AnnouncementsPage } from '@/components/features/announcements/AnnouncementsPage'

type AnnouncementsSearch = {
  q?: string
  page: number
}

export const Route = createFileRoute('/(protected)/_layout/announcements/')({
  validateSearch: (raw): AnnouncementsSearch => {
    const q =
      typeof raw.q === 'string' && raw.q.length > 0 ? raw.q : undefined

    const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

    return { q, page }
  },
<<<<<<< HEAD
  component: AnnouncementsPage,
=======
  component: RouteComponent,
  pendingComponent: () => {
    return (
      <div className="w-full space-y-6 py-6">
        {Array.from({ length: PAGINATION_PAGE_SIZE }).map((_, i) => (
          <AnnouncementSkeleton key={i} />
        ))}
      </div>
    )
  },
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps }) => {
    const { page } = deps
    // const { user } = context
    const announcementList = await fetchAllAnnouncements({
      // data: { userId: user.id, batchId: null, page: page },
      data: { batchId: null, page: page },

    })
    const rowsCount = await fetchAllAnnouncementCount({
      data: { batchId: null }
      // data: { userId: context.user.id, batchId: null }

    })

    return { rowsCount, announcementList }
  }
>>>>>>> pre-prod-v3
})
