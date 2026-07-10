import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLoading } from '@/components/common'
import {
  AppMobileHeader,
  AppMobileTabBar,
  AppNavbar,
  SupportChatButton,
} from '@/components/features/layout'
import { AnnouncementModalController, ModalProvider } from '@/components/modals'
import MasaiverseMobileTabBar from '@/components/features/masaiverse-v2/MasaiverseMobileTabBar'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { layoutMainClasses, layoutMainClassesFullWidth } from '@/lib/layout'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import {
  getOldStudentUiUrlForPath,
  isLegacyStudentRedirectEnabled,
} from '@/utils/authRedirect'
import { initClarity, setCurrentUserForTracking } from '@/utils/tracking'


/** Paths served by this app when legacy redirect is enabled (everything else → old LMS). */
function isNewStudentExperienceRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname.startsWith('/masaiverse')) return true
  if (pathname.startsWith('/learn')) return true
  if (pathname.startsWith('/assignments')) return true
  if (pathname.startsWith('/lectures')) return true
  if (pathname.startsWith('/resources')) return true
  if (pathname.startsWith('/announcements')) return true
  if (pathname.startsWith('/messages')) return true
  if (pathname.startsWith('/bookmarks')) return true
  if (pathname.startsWith('/whats-new')) return true
  if (pathname.startsWith('/profile')) return true
  if (pathname.startsWith('/my-courses')) return true
  if (pathname.startsWith('/course')) return true
  if (pathname.startsWith('/support')) return true
  return false
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

    if (
      shouldRedirectToLegacy &&
      !isNewStudentExperienceRoute(location.pathname)
    ) {
      const url = new URL(location.href, 'http://localhost')
      const pathForLegacy = `${url.pathname}${url.search}`
      const oldUiUrl = getOldStudentUiUrlForPath(pathForLegacy)
      if (oldUiUrl) {
        throw redirect({ href: oldUiUrl })
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
  const mainClasses = isMasaiverseRoute
    ? layoutMainClassesFullWidth
    : layoutMainClasses

  useEffect(() => {
    initClarity()
  }, [])

  useEffect(() => {
    setCurrentUserForTracking(user)
  }, [user])

  return (
    <ModalProvider>
      <div className="min-h-dvh bg-[#FAF9F9] flex flex-col">
        <AppNavbar />
        {/* Mobile-only greeting header for the dashboard home; the desktop
            navbar (with the same announcements + onboarding actions) is hidden
            on mobile. */}
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
        {/* Floating support entry — hidden on the support page itself and on
            the masaiverse app surface. */}
        {!isMasaiverseRoute && !isSupportRoute ? <SupportChatButton /> : null}
        {/* Central modal system — announcement popups check on every page. */}
        <AnnouncementModalController />
      </div>
    </ModalProvider>
  )
}
