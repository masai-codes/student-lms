import { createFileRoute, redirect } from '@tanstack/react-router'

/** Canonical assignment problem detail now lives under `/learn` — redirect old bookmarks/links. */
export const Route = createFileRoute(
  '/(protected)/_layout/assignments_/$assignmentId/problems/$problemId',
)({
  loader: ({ params, location }) => {
    throw redirect({
      to: '/learn/assignments/$assignmentId/problems/$problemId',
      params: {
        assignmentId: params.assignmentId,
        problemId: params.problemId,
      },
      search: location.search,
      replace: true,
    })
  },
})
