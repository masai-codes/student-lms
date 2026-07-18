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
  // Exception: `/lectures/:id/zoom` (Zoom web view) is served only by the old
  // LMS and reused by both, so it must never switch — otherwise it bounces
  // between the two apps. Only this sub-path is excluded; all other lecture
  // paths keep the existing behaviour.
  if (/^\/lectures\/[^/]+\/zoom(?:\/|$)/.test(pathname)) return false
  if (pathname.startsWith('/lectures')) return true
  if (pathname.startsWith('/assignments')) return true
  if (pathname.startsWith('/resources')) return true
  return false
}
