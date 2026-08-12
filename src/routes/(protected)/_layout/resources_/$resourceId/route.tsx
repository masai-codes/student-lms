import { createFileRoute, redirect } from '@tanstack/react-router'

/** Canonical resource detail now lives under `/learn` — redirect old bookmarks/links. */
export const Route = createFileRoute(
  '/(protected)/_layout/resources_/$resourceId',
)({
  loader: ({ params, location }) => {
    throw redirect({
      to: '/learn/resources/$resourceId',
      params: { resourceId: params.resourceId },
      search: location.search,
      replace: true,
    })
  },
})
