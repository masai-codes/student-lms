import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLoading } from '@/components/common'
import { AppMobileTabBar, AppNavbar } from '@/components/features/layout'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { layoutMainClasses } from '@/lib/layout'
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
  return false
}


export const Route = createFileRoute('/(protected)/_layout')({
  beforeLoad: async ({ location }) => {
    const shouldRedirectToLegacy = isLegacyStudentRedirectEnabled()
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
    const requestUrl = new URL(location.href, 'http://localhost')
    const token = requestUrl.searchParams.get('token')

    const user = await fetchCurrentUser()

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
      const redirectTarget = newStudentUiBase
        ? `${newStudentUiBase}${location.pathname}?${redirectSearchParams.toString()}`
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
