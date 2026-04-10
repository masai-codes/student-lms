import { Link, createFileRoute } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'
import { SkeletonCommon } from '@/components/common'

import {
    getCurrentPage,
    getTotalPages
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { Button } from '@/components/ui/button'
import { DiscussionCard } from '@/components/features/discussions'
import { fetchAllDiscussionsByEntityId } from '@/server/discussions/fetchAllDiscussionsByEntityId'
import { fetchAllDiscussionsCountByEntityId } from '@/server/discussions/fetchAllDiscussionsCountByEntityId'


export const Route = createFileRoute(
    '/(protected)/_layout/courses/$courseId/assignments_/$assignmentId/discussions/',
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
            <Card className='p-6'>
                <div className="space-y-6">
                    {Array.from({ length: PAGINATION_PAGE_SIZE }).map((_, i) => (
                        <SkeletonCommon key={i} />
                    ))}
                </div>
            </Card>
        )
    },
    loaderDeps: ({ search: { page } }) => ({ page }),

    loader: async ({ deps, params }) => {
        const { page } = deps
        const { assignmentId } = params

        const discussionList = await fetchAllDiscussionsByEntityId({
            data: { entityId: JSON.parse(assignmentId), entityType: 'Assignment', page: page },
        })
        const rowsCount = await fetchAllDiscussionsCountByEntityId({
            data: { entityId: JSON.parse(assignmentId), entityType: 'Assignment' }
        })

        return { rowsCount, discussionList }
    }
})

function RouteComponent() {
    const { courseId, assignmentId } = Route.useParams()
    const { page } = Route.useSearch()
    const navigate = Route.useNavigate()

    const currentPage = getCurrentPage(page)
    const setPage = createPageSetter(navigate)

    const { rowsCount, discussionList } = Route.useLoaderData()

    const totalPages = getTotalPages(
        rowsCount,
        PAGINATION_PAGE_SIZE,
    )

    return (
        <div className="bg-white border rounded-xl p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-end">
                    <Link to='/courses/$courseId/assignments/$assignmentId/discussions/create' params={{ courseId, assignmentId }}>
                        <Button className="bg-[#6962AC] text-white hover:bg-[#5A539C] transition-colors">
                            Create New
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    {discussionList.length === 0 ? (
                        <NoDiscussionsYet />
                    ) : (
                        discussionList.map((discussion, key) => (
                            <DiscussionCard
                                key={key}
                                discussion={discussion}
                            />
                        ))
                    )}
                </div>


                <AppPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    )
}








function NoDiscussionsYet() {
    return (
        <div className="bg-white flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <img src="/ChatsCircle.svg" alt="icon" className='h-24 w-24'/>
            <p className='font-semibold text-xl'>No Discussions Yet</p>
            <p className='text-[#6B7280]'>Discussions will appear here once they’re created</p>
        </div>
    )
}