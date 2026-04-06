import { createFileRoute } from '@tanstack/react-router'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'
import { SkeletonCommon } from '@/components/common'

import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { ResourceCard } from '@/components/features/courses'
import { fetchAllResources } from '@/server/resources/fetchAllResources'
import { fetchAllResourcesCount } from '@/server/resources/fetchAllResourcesCount'

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/_courseTabLayout/resources/',
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
      <div className="space-y-6">
        {Array.from({ length: PAGINATION_PAGE_SIZE }).map((_, i) => (
          <SkeletonCommon key={i} />
        ))}
      </div>
    )
  },
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps, context, params }) => {
    const { page } = deps
    const { user } = context
    const { courseId } = params

    const resourcesList = await fetchAllResources({
      data: { userId: user.id, batchId: JSON.parse(courseId), page: page },
    })
    const rowsCount = await fetchAllResourcesCount({
      data: { userId: context.user.id, batchId: JSON.parse(courseId) }
    })

    return { rowsCount, resourcesList }
  }
})

function RouteComponent() {
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)


  const { rowsCount, resourcesList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )


  return (
    <div className="space-y-6">

      <div className="space-y-4">
        {resourcesList.map((resource, key) => (
          <ResourceCard
            key={key}
            resource={resource}
          />
        ))}
      </div>

      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
