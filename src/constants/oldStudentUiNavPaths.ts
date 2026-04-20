/**
 * Paths on the legacy student app (`VITE_OLD_STUDENT_UI_URL`).
 * Keep in sync with `experience-ui/apps/student-experience` (`route.utils.ts`, `DesktopNavbar`, `MobileBottomNav`).
 */
export const OLD_STUDENT_UI_NAV_PATHS = {
  home: '/',
  myLectures: '/my-lectures',
  learn: '/learn',
  support: '/support?tab=unresolved',
  discussions: '/discussions',
  bookmarks: '/bookmarks?tab=Lecture',
  referAndEarn: '/changemakers-circle',
  calendar: '/my-calendar',
  chat: '/chat',
  announcements: '/announcements',
  /** Mobile bottom nav “More” → legacy profile / settings hub. */
  profileSettings: '/profile-settings',
} as const
