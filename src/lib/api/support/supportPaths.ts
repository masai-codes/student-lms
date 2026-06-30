/**
 * Support module — API path constants.
 *
 * Single source of truth for every support endpoint URL. The typed client
 * (`supportApi.ts`) and the React Query keys reference these so a path change is
 * a one-line edit. Mirrors `masaiverse-v2/masaiverseV2Paths.ts`.
 */
export const SUPPORT_API = {
  /** GET — aggregated landing payload (the one page-load request). */
  overview: '/api/support/overview',
  /** GET — search/list FAQs for a batch. */
  faqs: '/api/support/faqs',
  /** GET — subcategories for a single (context) category. */
  subcategories: '/api/support/subcategories',
  /** POST — vote on an FAQ. */
  faqVote: '/api/support/faqs/vote',
  /** GET — the student's tickets for a tab. */
  tickets: '/api/support/tickets',
  /** GET — one ticket's full conversation. */
  ticketThread: '/api/support/tickets/thread',
  /** POST — create a ticket. */
  ticketCreate: '/api/support/tickets/create',
  /** POST — reply to a ticket. */
  ticketReply: '/api/support/tickets/reply',
  /** POST — rate a ticket. */
  ticketRate: '/api/support/tickets/rate',
  /** POST — reopen a ticket. */
  ticketReopen: '/api/support/tickets/reopen',
  /** POST — escalate a ticket. */
  ticketEscalate: '/api/support/tickets/escalate',
  /** POST — request a callback. */
  callbackCreate: '/api/support/callback/create',
  /** POST (multipart) — upload a ticket attachment. */
  upload: '/api/support/upload',
} as const
