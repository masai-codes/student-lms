import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { AppMobileTabBar, AppNavbar } from "@/components/features/layout"
import { layoutMainClasses } from "@/lib/layout"
import { fetchCurrentUser } from "@/server/auth/fetchCurrentUser"
import { getOldStudentUiUrlForPath } from "@/utils/authRedirect"

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: async ({ location }) => {
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
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
  return (
    <div className="min-h-dvh bg-[#FAF9F9] flex flex-col">
      <AppNavbar />
      <main
        className={`${layoutMainClasses} pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0`}
      >
        <Outlet />
      </main>
      <AppMobileTabBar />
    </div>
  )
}
