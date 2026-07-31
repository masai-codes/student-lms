/** Primary nav ids shared by top navbar and mobile tab bar. */
export type AppNavItemId = 'home' | 'learn' | 'community' | 'interviews'

/**
 * Which primary nav item matches the current in-app route.
 * Align with `isNewStudentExperienceRoute` in `routes/(protected)/_layout/route.tsx`.
 */
export function activeAppNavIdForPathname(
  pathname: string,
): AppNavItemId | undefined {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/learn')) return 'learn'
  if (pathname.startsWith('/masaiverse')) return 'community'
  if (
    pathname.startsWith('/assignments') ||
    pathname.startsWith('/lectures') ||
    pathname.startsWith('/resources')
  ) {
    return 'learn'
  }
  if (pathname.startsWith('/chat')) return 'community'
  return undefined
}
