import { createFileRoute } from '@tanstack/react-router'
import { FilterAndSeachBar } from '@/components/common'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'
import { Pagination as AppPagination } from '@/components/common'
import { SkeletonCommon } from '@/components/common'

import {
  getCurrentPage,
  getTotalPages,
} from '@/utils/pagination'
import { createPageSetter } from '@/utils/routerPagination'
import { fetchAllTickets } from '@/server/tickets/fetchAllTickets'
import { fetchAllTicketsCount } from '@/server/tickets/fetchAllTicketsCount'
import { TicketCard } from '@/components/features/support'

export const Route = createFileRoute(
  '/(protected)/_layout/support/',
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
      <div className="p-6 space-y-6">
        {/** TODO: Drop this H2 and FilterAndSeach component in a _layout */}
        <h2 className="text-2xl font-semibold">Support</h2>
        <FilterAndSeachBar referer='support_o'/>
        {Array.from({ length: PAGINATION_PAGE_SIZE }).map((_, i) => (
          <SkeletonCommon key={i} />
        ))}
      </div>
    )
  },
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps, context }) => {
    const { page } = deps
    const { user } = context
    const ticketList = await fetchAllTickets({
      data: { userId: user.id, page: page },
    })
    const rowsCount = await fetchAllTicketsCount({
      data: { userId: context.user.id }
    })

    return { rowsCount, ticketList }
  }
})

function RouteComponent() {
  const { page } = Route.useSearch()
  const navigate = Route.useNavigate()

  const currentPage = getCurrentPage(page)
  const setPage = createPageSetter(navigate)


  const { rowsCount, ticketList } = Route.useLoaderData()

  const totalPages = getTotalPages(
    rowsCount,
    PAGINATION_PAGE_SIZE,
  )


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Support</h2>

      <FilterAndSeachBar referer='support_o'/>

      <div className="space-y-4">
        {ticketList.map((ticket, key) => (
          <TicketCard
            key={key}
            support={ticket}
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
