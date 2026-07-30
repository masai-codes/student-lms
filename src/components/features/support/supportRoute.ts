import { getRouteApi } from '@tanstack/react-router'

/**
 * Shared handle to the `/support` route so any legacy support component can
 * read/write the URL search params (tickets / tab / step / ticketId / category
 * / subcategory / page) — the legacy flow is entirely search-param driven.
 *
 * The `/support` route now renders the consolidated floating-chat support page,
 * so these params are no longer part of the route's validated search. This
 * facade keeps the (currently unrouted) legacy `BatchTickets` flow typed to its
 * original {@link SupportSearch} contract without coupling it to the route.
 */
const routeApi = getRouteApi('/(protected)/_layout/support/')

/** The legacy support flow's search-param shape. */
export type SupportSearch = {
  /** The selected batch (Help-tab scope). Absent = batch picker / single batch. */
  batchId?: number
  tickets?: 'ticketlisting' | 'pair-programming'
  tab?: string
  step?: 'ticketCreate' | 'ticketdetails'
  ticketId?: number
  category?: string
  subcategory?: string
  page?: number
}

type SupportNavigateOptions = {
  to?: string
  replace?: boolean
  search?: SupportSearch | ((prev: SupportSearch) => SupportSearch)
}

export const supportRouteApi = {
  useSearch: (): SupportSearch => routeApi.useSearch() as SupportSearch,
  useNavigate: () => {
    const navigate = routeApi.useNavigate()
    return (options: SupportNavigateOptions) => navigate(options as never)
  },
}
