/**
 * The migrated pages (n=5) released to the new LMS behind the per-user
 * "Try New" flag: Dashboard, Learn listing, and Lecture / Assignment /
 * Resource detail. When the user opts in these stay on the new LMS; otherwise
 * (with legacy redirect enabled) they are served by the old LMS.
 *
 * Keep this list in sync with the old LMS `isMigratedPath` matcher
 * (`experience-ui/apps/student-experience`).
 */
export function isMigratedRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname === '/learn' || pathname.startsWith('/learn/')) return true
  if (pathname.startsWith('/lectures')) return true
  if (pathname.startsWith('/assignments')) return true
  if (pathname.startsWith('/resources')) return true
  return false
}
