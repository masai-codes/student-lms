/**
 * Support module — React Query options + keys.
 *
 * Central place for every support query key and its options. Components use
 * these so cache keys are consistent and mutations can invalidate precisely.
 *
 * Caching model (the "one GET, then refetch on change" principle):
 *   - The overview is the page-load query. After any mutation the component
 *     invalidates `SUPPORT_KEYS.overview` (and the affected thread) so only the
 *     changed data re-fetches — no full reload.
 *   - `refetchOnMount: 'always'` makes navigating back to a screen show cached
 *     data instantly while refreshing in the background.
 */

import type { TicketTab } from '@/server/api/support/support.types'
import {
  fetchFloatingChatInbox,
  fetchLectureSupportSnapshot,
  fetchSubcategoriesByCategory,
  fetchSupportFaqs,
  fetchSupportOverview,
  fetchSupportTickets,
  fetchTicketThread,
} from '@/lib/api/support/supportApi'

/** All support query keys live here so invalidation is unambiguous. */
export const SUPPORT_KEYS = {
  all: ['support'] as const,
  overview: (batchId?: number) => ['support', 'overview', batchId ?? 'default'] as const,
  floatingChatInbox: ['support', 'floating-chat', 'inbox'] as const,
  lectureSnapshot: (lectureId: number) =>
    ['support', 'floating-chat', 'lecture', lectureId] as const,
  faqs: (batchId: number, search: string, category?: string) =>
    ['support', 'faqs', batchId, search, category ?? null] as const,
  tickets: (tab: TicketTab, page: number) =>
    ['support', 'tickets', tab, page] as const,
  thread: (ticketId: number) => ['support', 'thread', ticketId] as const,
  subcategories: (category: string) =>
    ['support', 'subcategories', category] as const,
}

const REFETCH_ON_NAV = { refetchOnMount: 'always' } as const

/** The single aggregated landing payload. */
export const supportOverviewQuery = (batchId?: number) => ({
  queryKey: SUPPORT_KEYS.overview(batchId),
  queryFn: () => fetchSupportOverview(batchId),
  staleTime: 60 * 1000,
  ...REFETCH_ON_NAV,
})

/**
 * Floating support modal — fetched once on first open, cached until page reload.
 */
export const floatingChatInboxQuery = () => ({
  queryKey: SUPPORT_KEYS.floatingChatInbox,
  queryFn: () => fetchFloatingChatInbox(),
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})

/** Lecture snapshot for floating support item confirmation (probes CDN server-side). */
export const lectureSupportSnapshotQuery = (lectureId: number) => ({
  queryKey: SUPPORT_KEYS.lectureSnapshot(lectureId),
  queryFn: () => fetchLectureSupportSnapshot(lectureId),
  staleTime: 2 * 60 * 1000,
})

/** Live FAQ search for a batch (enabled by the caller while searching). */
export const supportFaqsQuery = (input: {
  batchId: number
  search: string
  category?: string
}) => ({
  queryKey: SUPPORT_KEYS.faqs(input.batchId, input.search, input.category),
  queryFn: () =>
    fetchSupportFaqs({
      batchId: input.batchId,
      search: input.search || undefined,
      category: input.category,
    }),
  staleTime: 60 * 1000,
})

/** A page of the student's tickets for a tab. */
export const supportTicketsQuery = (tab: TicketTab, page = 1) => ({
  queryKey: SUPPORT_KEYS.tickets(tab, page),
  queryFn: () => fetchSupportTickets({ tab, page }),
  staleTime: 30 * 1000,
  ...REFETCH_ON_NAV,
})

/** Subcategories for a single context category (lecture / resource / assignment). */
export const supportSubcategoriesQuery = (category: string) => ({
  queryKey: SUPPORT_KEYS.subcategories(category),
  queryFn: () => fetchSubcategoriesByCategory(category),
  staleTime: 5 * 60 * 1000,
})

/** One ticket's conversation. */
export const ticketThreadQuery = (ticketId: number) => ({
  queryKey: SUPPORT_KEYS.thread(ticketId),
  queryFn: () => fetchTicketThread(ticketId),
  staleTime: 15 * 1000,
  ...REFETCH_ON_NAV,
})
