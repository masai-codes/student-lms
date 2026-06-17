import { getRouteApi } from '@tanstack/react-router'

/**
 * Shared handle to the `/support` route so any support component can read/write
 * the URL search params (tickets / tab / step / ticketId / category /
 * subcategory / page) — the legacy flow is entirely search-param driven, and we
 * preserve that for deep-linking + back-navigation.
 */
export const supportRouteApi = getRouteApi('/(protected)/_layout/support/')

/** The validated shape of the support route's search params. */
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
