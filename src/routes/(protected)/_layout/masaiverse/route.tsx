import { useEffect } from 'react'
import {
  Outlet,
  createFileRoute,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import MasaiverseHomepage from '@/components/features/masaiverse/MasaiverseHomepage'
import { showMasaiversePage } from '@/server/masaiverse/showMasaiversePage'
import { redirectToOldStudentUi } from '@/utils/authRedirect'

export const Route = createFileRoute('/(protected)/_layout/masaiverse')({
  loader: async ({ context }) => {
    if (context.user.role === 'admin') {
      return { canShowMasaiverse: true }
    }

    const canShowMasaiverse = await showMasaiversePage({
      data: { userId: context.user.id },
    })
    return { canShowMasaiverse }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { canShowMasaiverse } = Route.useLoaderData()
  const router = useRouter()
  const { pathname, searchStr } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr,
    }),
  })
  const isMasaiverseEventsPage =
    pathname === '/masaiverse' &&
    new URLSearchParams(searchStr).get('tab') === 'events'

  useEffect(() => {
    if (!canShowMasaiverse) {
      redirectToOldStudentUi()
    }
  }, [canShowMasaiverse])

  if (!canShowMasaiverse) return null

  return (
    <>
      {isMasaiverseEventsPage ? (
        <div className="fixed inset-x-0 top-0 z-[120] rounded-b-[16px] border-b border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(17,24,39,0.06)] md:hidden">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              className="absolute left-0 inline-flex items-center gap-1 text-[14px] font-medium text-[#111827]"
              onClick={() => router.history.back()}
              aria-label="Go back"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
            <p className="text-[16px] font-semibold text-[#111827]">Masaiverse</p>
          </div>
        </div>
      ) : null}
      <div className={isMasaiverseEventsPage ? 'pt-[57px] md:pt-0' : ''}>
        <MasaiverseHomepage>
          <Outlet />
        </MasaiverseHomepage>
      </div>
    </>
  )
}
