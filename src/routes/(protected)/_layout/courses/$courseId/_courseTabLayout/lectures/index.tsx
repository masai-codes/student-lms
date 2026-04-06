import { createFileRoute } from '@tanstack/react-router'
import { LectureCard } from '@/components/features/courses'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'
import { SkeletonCommon } from '@/components/common'
import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { fetchAllLectures } from '@/server/lectures/fetchAllLectures'
import { fetchAllLecturesCount } from '@/server/lectures/fetchAllLecturesCount'


export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/_courseTabLayout/lectures/',
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
      <div className="space-y-4">
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

    const lectureList = await fetchAllLectures({
      data: { userId: user.id, batchId: JSON.parse(courseId), page: page },
    })
    const rowsCount = await fetchAllLecturesCount({
      data: { userId: context.user.id, batchId: JSON.parse(courseId) }
    })

    return { rowsCount, lectureList }
  }
})

function RouteComponent() {
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)

  const { rowsCount, lectureList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {lectureList.map((lecture, key) => (
          <LectureCard
            key={key}
            lecture={lecture}
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

