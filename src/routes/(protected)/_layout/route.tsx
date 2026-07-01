import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppMobileTabBar, AppNavbar } from '@/components/features/layout'
import MasaiverseMobileTabBar from '@/components/features/masaiverse-v2/MasaiverseMobileTabBar'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { layoutMainClasses, layoutMainClassesFullWidth } from '@/lib/layout'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import { initClarity, setCurrentUserForTracking } from '@/utils/tracking'
import { getLegacyProtectedRouteRedirectUrl } from '@/utils/authRedirect'
import { getNewStudentUiUrl } from '@/utils/viteEnv'

export const Route = createFileRoute('/(protected)/_layout')({
  beforeLoad: async ({ location }) => {
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
    const isSigninRoute = location.pathname === '/signin'
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

    if (isMasaiverseRoute && token) {
      const newStudentUiBase = getNewStudentUiUrl()?.replace(/\/$/, '')
      const redirectSearchParams = new URLSearchParams(requestUrl.searchParams)
      // Token is only needed for legacy app redirect auth flow.
      redirectSearchParams.delete('token')
      redirectSearchParams.set('isApp', 'true')
      // The app handoff always lands on masaiverse home, regardless of which
      // masaiverse path the token arrived on.
      const redirectTarget = newStudentUiBase
        ? `${newStudentUiBase}/masaiverse/home?${redirectSearchParams.toString()}`
        : null

      if (user && redirectTarget) {
        throw redirect({ href: redirectTarget })
      }

      if (!user && redirectTarget) {
        throw redirect({ to: '/signin' })
      }
    }

    if (!user) {
      throw redirect({ to: '/signin' })
    }
    // also for homepage we dont want to do legacy redirect and  for /sign also
    if (!isMasaiverseRoute && !isSigninRoute) {
      const oldUiUrl = getLegacyProtectedRouteRedirectUrl(location.href)
      if (oldUiUrl) {
        throw redirect({ href: oldUiUrl })
      }
    }
    return {
      user,
    }
  },
  component: RouteComponent,
  pendingComponent: () => <div>Loading...</div>,
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
    <div className="min-h-dvh bg-[#FAF9F9] flex flex-col">
      <AppNavbar />
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
    </div>
  )
}
