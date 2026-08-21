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
 *   /my-programs[/…]               → /my-lectures[/…]
 *   /my-courses[/…]                → /my-lectures[/…]  (pre-rename alias)
 *   /course/:id                    → /new-courses/:id
 */
export function mapToLegacyPath(pathname: string): string {
  // `/my-courses` is the pre-rename alias for `/my-programs`; both are the old
  // LMS's `/my-lectures`. Listed here as well as in the redirect route so a
  // hand-off from the alias lands on the right old-LMS page rather than a 404.
  const programsPath = /^\/(my-programs|my-courses)(?=\/|$)/
  if (programsPath.test(pathname)) {
    return pathname.replace(programsPath, '/my-lectures')
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
