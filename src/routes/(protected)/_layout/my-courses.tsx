import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * The program listing is canonically `/my-programs` — the page, its heading and
 * the nav item all say "My Programs". `/my-courses` was the working name while
 * it was being rebuilt and is still what the old LMS's `legacyPathMap` entry and
 * any early bookmarks point at, so it redirects rather than 404s.
 */
export const Route = createFileRoute('/(protected)/_layout/my-courses')({
  loader: ({ location }) => {
    throw redirect({
      to: '/my-programs',
      search: location.search,
      replace: true,
    })
  },
})
