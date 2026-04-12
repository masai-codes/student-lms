import { createFileRoute } from '@tanstack/react-router'
import { FilterAndSeachBar } from '@/components/common'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'

import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { DiscussionCard } from '@/components/features/discussions'
import { fetchAllDiscussions } from '@/server/discussions/fetchAllDiscussions'
import { DiscussionTabFilters } from '@/components/features/discussions'
import { fetchAllDiscussionsCount } from '@/server/discussions/fetchAllDiscussionsCount'
import { Skeleton } from '@/components/ui/skeleton'

/** URL-driven discussion filter */
export type DiscussionType = 'lecture' | 'assignment' | 'resources'

export const Route = createFileRoute(
  '/(protected)/_layout/discussions/',
)({
  validateSearch: (search) => {
    const page =
      typeof search.page === 'number'
        ? search.page
        : Number(search.page)

    const type: DiscussionType | undefined =
      search.type === 'lecture' ||
      search.type === 'assignment' ||
      search.type === 'resources'
        ? search.type
        : undefined

    return {
      page: page && page > 0 ? page : undefined,
      type,
    }
  },

  component: RouteComponent,

  pendingComponent: () => {
    return (
      <SkeletonDiscussion />
    )
  },

  loaderDeps: ({ search: { page, type } }) => ({
    page,
    type,
  }),

  loader: async ({ deps, context }) => {
    const { page, type } = deps
    const { user } = context

    const discussionList = await fetchAllDiscussions({
      data: {
        userId: user.id,
        page,
        type,
      },
    })

    const rowsCount = await fetchAllDiscussionsCount({
      data: {
        userId: user.id,
        type,
      },
    })

    return { rowsCount, discussionList }
  },
})

function RouteComponent() {
  const { page, type } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)

  const { rowsCount, discussionList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )

  /** TS-safe narrowing for tabs */
  const activeType: DiscussionType | undefined =
    type === 'lecture' ||
    type === 'assignment' ||
    type === 'resources'
      ? type
      : undefined

  return (
    <div className="w-full space-y-6 py-6">
      <h2 className="text-2xl font-semibold">Discussions</h2>

      <div className="flex justify-between items-center">
        <DiscussionTabFilters activeType={activeType} />
        <FilterAndSeachBar referer="discussions" />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="space-y-4">
          {discussionList.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
            />
          ))}
        </div>
      </div>

      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}








function SkeletonDiscussion(){
  return(
    <div className="w-full space-y-6 py-6">
      {/* Page title */}
      <Skeleton className="h-8 w-48" />

      {/* Filters row */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-56 rounded-md" />
        <Skeleton className="h-10 w-64 rounded-md" />
      </div>

      {/* Discussions list */}
      <div className="p-6 bg-white border rounded-xl">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border p-4"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />

              <div className="mt-2 flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}
