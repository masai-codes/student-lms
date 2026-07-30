import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/support/$supportId` — legacy deep-link to a single ticket.
 *
 * The standalone support page is now the consolidated `/support` experience,
 * so a bare ticket deep-link simply redirects there.
 */
export const Route = createFileRoute(
  '/(protected)/_layout/support/$supportId/',
)({
  beforeLoad: () => {
    throw redirect({ to: '/support' })
  },
})
