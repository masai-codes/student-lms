import { createFileRoute } from '@tanstack/react-router'
import { FilterAndSeachBar } from '@/components/common'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'

import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { fetchAllAnnouncements } from '@/server/announcements/fetchAllAnnouncement'
import { fetchAllAnnouncementCount } from '@/server/announcements/fetchAllAnnouncementCount'
import { AnnouncementCard } from '@/components/features/courses'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute(
  '/(protected)/_layout/announcements/',
)({
  validateSearch: (search) => {
    const page =
      typeof search.page === 'number'
        ? search.page
        : Number(search.page)

    return {
      page: page && page > 0 ? page : undefined,
    }
  },
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
  loader: async ({ deps, context }) => {
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
})

function RouteComponent() {
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)

  const { rowsCount, announcementList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )

  return (
    <div className="w-full space-y-6 py-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Announcements</h2>
        <FilterAndSeachBar referer="discussions" />
      </div>



      <div className="space-y-4">
        {announcementList.length > 0 ? (
          announcementList.map((announcement, key) => (
            <AnnouncementCard
              key={key}
              announcement={announcement}
            />
          ))
        ) : (
          <NoAnnouncementYet />
        )}
      </div>



      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}





function AnnouncementSkeleton() {
  return (
    <div className="p-4 bg-white border rounded-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Left content */}
        <div className="flex gap-4 flex-1">
          {/* Icon */}
          <Skeleton className="h-10 w-10 rounded-md" />

          {/* Text */}
          <div className="space-y-3 flex-1">
            {/* Title */}
            <Skeleton className="h-5 w-[60%]" />

            {/* Subtitle */}
            <Skeleton className="h-4 w-[45%]" />
          </div>
        </div>

        {/* Right status icon */}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}


function NoAnnouncementYet() {
  return (
    <div className="bg-white flex border rounded-xl flex-col items-center justify-center min-h-[600px] space-y-4">
      <img src="/AnnouncementIconGrey.svg" alt="icon" className='h-24 w-24' />
      <p className='font-semibold text-xl'>No Announcements Yet</p>
      <p className='text-[#6B7280]'>Announcements will show up here once they’re posted.</p>
    </div>
  )
}