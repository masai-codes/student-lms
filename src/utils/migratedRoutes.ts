/**
 * The migrated pages released to the new LMS behind the per-user "Try New"
 * flag: Dashboard, Learn listing, Lecture / Assignment / Resource detail, plus
 * Announcements, Messages, Bookmarks, What's New, Support, Chat and
 * Profile & Settings. When the user opts in
 * these stay on the new LMS; otherwise (with legacy redirect enabled) they are
 * served by the old LMS.
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
  if (pathname.startsWith('/announcements')) return true
  if (pathname.startsWith('/messages')) return true
  if (pathname.startsWith('/bookmarks')) return true
  if (pathname.startsWith('/whats-new')) return true
  if (pathname.startsWith('/chat')) return true
  // Mobile bottom nav "More" → Profile & Settings hub. Same path on both apps.
  if (pathname.startsWith('/profile-settings')) return true
  // Support is the one migrated page that must stay reachable here even for
  // opted-out students: the old LMS embeds this app's `/support` (and
  // `/support/context`) in an iframe, so bouncing it back would recurse. The
  // page is served unconditionally (see `isNewStudentExperienceRoute` in the
  // protected layout); it is listed here only so the "Try New" toggle and the
  // old LMS hand-off treat it as migrated.
  if (pathname === '/support') return true
  return false
}
