import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppMobileTabBar, AppNavbar } from '@/components/features/layout'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { layoutMainClasses } from '@/lib/layout'
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

    const user = await fetchCurrentUser()

    if (isMasaiverseRoute && token) {
      const newStudentUiBase = getNewStudentUiUrl()?.replace(/\/$/, '')
      const redirectSearchParams = new URLSearchParams(requestUrl.searchParams)
      // Token is only needed for legacy app redirect auth flow.
      redirectSearchParams.delete('token')
      redirectSearchParams.set('isApp', 'true')
      const redirectTarget = newStudentUiBase
        ? `${newStudentUiBase}${location.pathname}?${redirectSearchParams.toString()}`
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
  const searchStr = useRouterState({ select: (state) => state.location.searchStr })
  const { user } = Route.useRouteContext()
  const isApp = isMasaiverseApp(searchStr)

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
        className={`${layoutMainClasses} ${isApp ? 'pb-0' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'} md:pb-0`}
      >
        <Outlet />
      </main>
      {!isApp ? <AppMobileTabBar /> : null}
    </div>
  )
}
