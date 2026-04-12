import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { AppNavbar } from "@/components/features/layout"
import { layoutMainClasses } from "@/lib/layout"
import { fetchCurrentUser } from "@/server/auth/fetchCurrentUser"

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: async () => {
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
      <main className={layoutMainClasses}>
        <Outlet />
      </main>
    </div>
  )
}
