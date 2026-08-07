import { createFileRoute, redirect } from '@tanstack/react-router'

/** Canonical lecture detail now lives under `/learn` — redirect old bookmarks/links. */
export const Route = createFileRoute(
  '/(protected)/_layout/lectures_/$lectureId',
)({
  loader: ({ params, location }) => {
    throw redirect({
      to: '/learn/lectures/$lectureId',
      params: { lectureId: params.lectureId },
      search: location.search,
      replace: true,
    })
  },
})
