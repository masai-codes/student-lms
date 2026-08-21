import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/my-lectures` is the OLD LMS's path for this page (`pages/lectures/Learn.tsx`).
 * A student who lands on it here — a stale bookmark, or a shared link with the
 * domain swapped — gets the rebuilt `/my-programs` instead of a 404.
 *
 * This does not conflict with the outbound hand-off: an opted-out student is
 * redirected to the old LMS by the protected layout's `beforeLoad`, which runs
 * before this loader, and that redirect targets the old app's origin.
 */
export const Route = createFileRoute('/(protected)/_layout/my-lectures')({
  loader: ({ location }) => {
    throw redirect({
      to: '/my-programs',
      search: location.search,
      replace: true,
    })
  },
})
