import { createFileRoute, redirect } from '@tanstack/react-router'

/** Canonical assignment detail now lives under `/learn` — redirect old bookmarks/links. */
export const Route = createFileRoute(
  '/(protected)/_layout/assignments_/$assignmentId',
)({
  loader: ({ params, location }) => {
    throw redirect({
      to: '/learn/assignments/$assignmentId',
      params: { assignmentId: params.assignmentId },
      search: location.search,
      replace: true,
    })
  },
})
