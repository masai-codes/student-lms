/**
 * New→old path translation for every hand-off to the legacy student app
 * (`isMigratedRoute` switch-back, the "Try New" toggle, and the protected-layout
 * legacy redirect).
 *
 * The two apps do NOT share all route shapes: this app nests the learn detail
 * pages and discussions under `/learn/*`, while the old LMS serves them at the
 * top level. Handing off the path verbatim lands on a 404 there, so anything
 * whose old-LMS route differs must be listed here.
 *
 * Old-LMS routes (see `experience-ui/apps/student-experience/src/pages/Routes.tsx`):
 *   /learn/discussions             → /discussions
 *   /learn/lectures/:id            → /lectures/:id
 *   /learn/resources/:id           → /resources/:id
 *   /learn/assignments/:id         → /assignments/:id
 *   /learn/assignments/:id/problems/:problemId → /assignments/:id
 *     (the old problem view needs a third `:elementID` segment we don't have,
 *      so fall back to the assignment detail page)
 *   /my-courses[/…]                → /my-lectures[/…]
 *   /course/:id                    → /new-courses/:id
 */
export function mapToLegacyPath(pathname: string): string {
  if (pathname === '/my-courses' || pathname.startsWith('/my-courses/')) {
    return pathname.replace(/^\/my-courses/, '/my-lectures')
  }
  if (pathname === '/course' || pathname.startsWith('/course/')) {
    return pathname.replace(/^\/course/, '/new-courses')
  }
  if (pathname === '/learn/discussions') return '/discussions'
  const assignmentProblem =
    /^\/learn\/assignments\/([^/]+)\/problems(?:\/|$)/.exec(pathname)
  if (assignmentProblem) return `/assignments/${assignmentProblem[1]}`
  // Remaining `/learn/<lectures|assignments|resources>/…` detail pages exist at
  // the top level on the old LMS with the same trailing segments.
  if (/^\/learn\/(lectures|assignments|resources)\//.test(pathname)) {
    return pathname.replace(/^\/learn/, '')
  }
  return pathname
}
