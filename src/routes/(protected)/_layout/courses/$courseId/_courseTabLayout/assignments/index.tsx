import { createFileRoute } from '@tanstack/react-router'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'
import { SkeletonCommon } from '@/components/common'

import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { fetchAllAssignments } from '@/server/assignments/fetchAllAssignments'
import { AssignmentCard } from '@/components/features/courses'
import { fetchAllAssignmentsCount } from '@/server/assignments/fetchAllAssignmentsCount'

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/_courseTabLayout/assignments/',
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

    const assignmentList = await fetchAllAssignments({
      data: { userId: user.id, batchId: JSON.parse(courseId), page: page },
    })
    const rowsCount = await fetchAllAssignmentsCount({
      data: { userId: context.user.id, batchId: JSON.parse(courseId) }
    })

    return { rowsCount, assignmentList }
  }
})

function RouteComponent() {
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)

  const { rowsCount, assignmentList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        {assignmentList.map((assignment, key) => (
          <AssignmentCard
            key={key}
            assignment={assignment}
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
