import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLoading, FloatingChatProvider } from '@/components/common'
import {
  AppMobileHeader,
  AppMobileTabBar,
  AppNavbar,
  SupportChatButton,
} from '@/components/features/layout'
import { TryNewTour } from '@/components/features/layout/TryNewTour'
import { AnnouncementModalController, ModalProvider } from '@/components/modals'
import MasaiverseMobileTabBar from '@/components/features/masaiverse-v2/MasaiverseMobileTabBar'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import {
  layoutMainClasses,
  layoutMainClassesFullWidth,
  lectureDetailMainClasses,
} from '@/lib/layout'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import {
  getOldStudentUiUrlForPath,
  isLegacyStudentRedirectEnabled,
} from '@/utils/authRedirect'
import { isMigratedRoute } from '@/utils/migratedRoutes'
import { initClarity, setCurrentUserForTracking } from '@/utils/tracking'

/** Hardcoded kill-switch for the new floating support chat. Flip to `false` to fall back to the old /support button. */
const ENABLE_SUPPORT_FLOATER = true

/** Paths served by this app when legacy redirect is enabled (everything else → old LMS). */
/**
 * Paths served by this app when legacy redirect is enabled (everything else →
 * old LMS). Deliberately minimal: only the 5 migrated pages (flag-gated,
 * handled separately) plus `masaiverse` and `support` stay on the new LMS.
 * Everything else — announcements, messages, bookmarks, whats-new, profile,
 * my-courses, course, etc. — redirects to the old LMS.
 */
function isNewStudentExperienceRoute(pathname: string): boolean {
  if (pathname.startsWith('/masaiverse')) return true
  if (pathname === '/support' || pathname.startsWith('/support/')) {
    return true
  }
  return false
}

/**
 * New→old path translation for pages whose old-LMS route differs. Anything not
 * listed keeps the same path on the old LMS.
 *   /my-courses  → /my-lectures      (course listing)
 *   /course/:id  → /new-courses/:id  (course detail)
 */
function mapToLegacyPath(pathname: string): string {
  if (pathname === '/my-courses' || pathname.startsWith('/my-courses/')) {
    return pathname.replace(/^\/my-courses/, '/my-lectures')
  }
  if (pathname === '/course' || pathname.startsWith('/course/')) {
    return pathname.replace(/^\/course/, '/new-courses')
  }
  return pathname
}

export const Route = createFileRoute('/(protected)/_layout')({
  beforeLoad: async ({ location }) => {
    const shouldRedirectToLegacy = isLegacyStudentRedirectEnabled()
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
    const requestUrl = new URL(location.href, 'http://localhost')
    const token = requestUrl.searchParams.get('token')

    let user = await fetchCurrentUser()

    // Auto-login fallback: only when there's no session yet but the request
    // carries a `?token=` (legacy/app hands the session off via the URL).
    // Verifying it persists the session cookie so later requests are authed.
    if (!user && token && isMasaiverseRoute) {
      console.log('Masaiverse:', isMasaiverseRoute, token)
      user = await bootstrapLoginWithToken({ data: token })
    }

    if (!user) {
      throw redirect({ to: '/signin' })
    }

    if (shouldRedirectToLegacy && isMasaiverseRoute && token) {
      const newStudentUiBase =
        import.meta.env.VITE_NEW_STUDENT_UI_URL?.trim().replace(/\/$/, '')
      const redirectSearchParams = new URLSearchParams(requestUrl.searchParams)
      // Token is only needed for legacy app redirect auth flow.
      redirectSearchParams.delete('token')
      redirectSearchParams.set('isApp', 'true')
      // The app handoff always lands on masaiverse home, regardless of which
      // masaiverse path the token arrived on.
      const redirectTarget = newStudentUiBase
        ? `${newStudentUiBase}/masaiverse/home?${redirectSearchParams.toString()}`
        : null

      if (redirectTarget) {
        throw redirect({ href: redirectTarget })
      }
    }

    if (shouldRedirectToLegacy) {
      const url = new URL(location.href, 'http://localhost')

      // The 5 migrated routes ignore the static allowlist: the per-user flag
      // decides. Opted in → stay here; opted out → old LMS. Every other route
      // keeps the existing allowlist behaviour.
      const shouldRedirectMigratedRoute =
        isMigratedRoute(location.pathname) && !user.newLmsPagesEnabled
      const shouldRedirectOtherRoute =
        !isMigratedRoute(location.pathname) &&
        !isNewStudentExperienceRoute(location.pathname)

      if (shouldRedirectMigratedRoute || shouldRedirectOtherRoute) {
        // Migrated pages hand off path-only — the old LMS regenerates its own
        // query params (batch/tab/page). Other legacy routes keep their search,
        // with a path translation where the old-LMS route differs.
        const pathForLegacy = shouldRedirectMigratedRoute
          ? url.pathname
          : `${mapToLegacyPath(url.pathname)}${url.search}`
        const oldUiUrl = getOldStudentUiUrlForPath(pathForLegacy)
        if (oldUiUrl) {
          throw redirect({ href: oldUiUrl })
        }
      }
    }
    return {
      user,
    }
  },
  component: RouteComponent,
  pendingComponent: () => <AppLoading fullPage label="Loading workspace..." />,
})

function RouteComponent() {
  const { searchStr, pathname } = useRouterState({
    select: (state) => ({
      searchStr: state.location.searchStr,
      pathname: state.location.pathname,
    }),
  })
  const { user } = Route.useRouteContext()
  const isApp = isMasaiverseApp(searchStr)
  const isMasaiverseRoute = pathname.startsWith('/masaiverse')
  const isSupportRoute = pathname.startsWith('/support')
  // Lecture detail spans the full viewport width (no centered container), so
  // every hero state is edge-to-edge like the recording video.
  const isLectureDetail = /^\/lectures\/[^/]+/.test(pathname)
  const mainClasses = isMasaiverseRoute
    ? layoutMainClassesFullWidth
    : isLectureDetail
      ? lectureDetailMainClasses
      : layoutMainClasses

  useEffect(() => {
    initClarity()
  }, [])

  useEffect(() => {
    setCurrentUserForTracking(user)
  }, [user])

  if (isSupportRoute) {
    return (
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    )
  }

  const showFloatingChat =
    ENABLE_SUPPORT_FLOATER && !isMasaiverseRoute && !isSupportRoute

  const layout = (
    <div className="min-h-dvh bg-surface-muted flex flex-col">
      <TryNewTour hasSeen={user.hasSeenTryNewTour} />
      <AppNavbar />
      {pathname === '/' && !isApp ? <AppMobileHeader /> : null}
      <main
        className={`${mainClasses} ${isApp && !isMasaiverseRoute ? 'pb-0' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'} md:pb-0`}
      >
        <Outlet />
      </main>
      {isMasaiverseRoute ? (
        <MasaiverseMobileTabBar />
      ) : !isApp ? (
        <AppMobileTabBar />
      ) : null}
      {!ENABLE_SUPPORT_FLOATER &&
      pathname === '/' &&
      !isMasaiverseRoute &&
      !isSupportRoute ? (
        <SupportChatButton />
      ) : null}
      <AnnouncementModalController />
    </div>
  )

  return (
    <ModalProvider>
      {showFloatingChat ? (
        <FloatingChatProvider>{layout}</FloatingChatProvider>
      ) : (
        layout
      )}
    </ModalProvider>
  )
}
