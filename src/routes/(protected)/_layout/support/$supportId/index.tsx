import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/support/$supportId` — deep-link to a single ticket.
 *
 * In the legacy flow the conversation is a modal on `/support` (driven by
 * `?step=ticketdetails&ticketId=`), not a standalone page. So this route simply
 * redirects into that modal flow, preserving deep-links to a ticket.
 */
export const Route = createFileRoute('/(protected)/_layout/support/$supportId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/support',
      search: {
        tickets: 'ticketlisting',
        tab: 'all',
        step: 'ticketdetails',
        ticketId: Number(params.supportId),
      },
    })
  },
})
