import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router"
import { AppMobileTabBar, AppNavbar } from "@/components/features/layout"
import { layoutMainClasses } from "@/lib/layout"
import { fetchCurrentUser } from "@/server/auth/fetchCurrentUser"
import { getOldStudentUiUrlForPath } from "@/utils/authRedirect"

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: async ({ location }) => {
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
    const requestUrl = new URL(location.href, 'http://localhost')
    const token = requestUrl.searchParams.get('token')

    if (isMasaiverseRoute && token) {
      const newStudentUiBase = import.meta.env.VITE_NEW_STUDENT_UI_URL?.trim().replace(/\/$/, '')
      const oldStudentUiBase = import.meta.env.VITE_OLD_STUDENT_UI_URL?.trim().replace(/\/$/, '')
      const redirectTarget = newStudentUiBase ? `${newStudentUiBase}/masaiverse?isApp=true` : null

      const user = await fetchCurrentUser()
      if (user && redirectTarget) {
        throw redirect({ href: redirectTarget })
      }

      if (!user && oldStudentUiBase && redirectTarget) {
        const appRedirectUrl = `${oldStudentUiBase}/app-redirect-app?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectTarget)}`
        throw redirect({ href: appRedirectUrl })
      }
    }

    if (!isMasaiverseRoute) {
      const oldUiUrl = getOldStudentUiUrlForPath(location.href)
      if (oldUiUrl) {
        throw redirect({ href: oldUiUrl })
      }
    }

    const user = await fetchCurrentUser()
    if (!user) {
      throw redirect({ to: "/login" })
    }
    return {
      user,
    }

  },
  component: RouteComponent,
  pendingComponent: () => <div>Loading...</div>
})


function RouteComponent() {
  const { pathname, searchStr } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr,
    }),
  })
  const shouldHideBottomTabBar =
    pathname.startsWith('/masaiverse') &&
    new URLSearchParams(searchStr).get('isApp') === 'true'

  return (
    <div className="min-h-dvh bg-[#FAF9F9] flex flex-col">
      <AppNavbar />
      <main
        className={`${layoutMainClasses} ${shouldHideBottomTabBar ? 'pb-0' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'} md:pb-0`}
      >
        <Outlet />
      </main>
      {shouldHideBottomTabBar ? null : <AppMobileTabBar />}
    </div>
  )
}
