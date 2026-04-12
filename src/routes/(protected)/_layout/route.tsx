import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { AppNavbar } from "@/components/features/layout"
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
      <main className="mx-auto w-full max-w-[1280px] flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  )
}


// px-[clamp(16px,6.25vw,80px)] py-6
