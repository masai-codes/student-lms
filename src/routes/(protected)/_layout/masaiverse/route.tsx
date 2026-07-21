import { useEffect } from 'react'
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import MasaiverseLoader from '@/components/features/masaiverse-v2/MasaiverseLoader'
import MasaiverseV2Page from '@/components/features/masaiverse-v2/MasaiverseV2Page'
import { markMasaiverseV2Visited } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { getMasaiverseAccessDebugServer } from '@/server/masaiverse/getMasaiverseAccessDebugServer'
import { redirectToOldStudentUi } from '@/utils/authRedirect'
import { sendTrackingEvent } from '@/utils/tracking'

type MasaiverseSearch = {
  isApp?: boolean
}

export const Route = createFileRoute('/(protected)/_layout/masaiverse')({
  validateSearch: (search: Record<string, unknown>): MasaiverseSearch => {
    const isApp =
      search.isApp === true ||
      search.isApp === 'true' ||
      search.isApp === 1 ||
      search.isApp === '1'
    return { isApp: isApp || undefined }
  },
  loader: async ({ context }) => {
    if (context.user.role === 'admin') {
      return {
        canShowMasaiverse: true,
        redirectReason: 'admin-user',
        masaiverseAccessDebug: {
          canShowMasaiverse: true,
          reason: 'admin-user',
          userId: context.user.id,
          enrolledBatchIds: [],
          matchingBatchIds: [],
        },
      }
    }

    const masaiverseAccessDebug = await getMasaiverseAccessDebugServer({
      data: { userId: context.user.id },
    })
    return {
      canShowMasaiverse: masaiverseAccessDebug.canShowMasaiverse,
      redirectReason: masaiverseAccessDebug.reason,
      masaiverseAccessDebug,
    }
  },
  // The access check is per-user and stable for the session. Caching it keeps
  // the loader from re-running on every in-section navigation, which is what
  // made switching between pages (events ↔ club ↔ …) flash a bare loader.
  staleTime: 5 * 60 * 1000,
  // Branded pending UI: keep the sidebar in place and show the Masai loader in
  // the content area instead of falling back to the layout's plain "Loading…".
  pendingComponent: () => (
    <MasaiverseV2Page>
      <MasaiverseLoader />
    </MasaiverseV2Page>
  ),
  component: RouteComponent,
})

function RouteComponent() {
  const { canShowMasaiverse, redirectReason, masaiverseAccessDebug } =
    Route.useLoaderData()
  const { pathname, searchStr } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr,
    }),
  })

  useEffect(() => {
    if (!canShowMasaiverse) {
      redirectToOldStudentUi({
        source: '(protected)/_layout/masaiverse RouteComponent useEffect',
        reason:
          'Masaiverse is unavailable for this user and should open in legacy UI',
        extra: {
          trigger: 'feature-gate-check',
          canShowMasaiverse,
          redirectReason,
          pathname,
          searchStr,
          masaiverseAccessDebug,
        },
      })
    }
  }, [
    canShowMasaiverse,
    masaiverseAccessDebug,
    pathname,
    redirectReason,
    searchStr,
  ])

  useEffect(() => {
    if (!canShowMasaiverse) return

    // Best-effort: mark the user as having visited Masaiverse once. Fired from
    // the section layout so it covers every Masaiverse page, and is a no-op on
    // the server after the first visit. Failures must never block the page.
    void markMasaiverseV2Visited().catch(() => {})
  }, [canShowMasaiverse])

  useEffect(() => {
    if (!canShowMasaiverse) return

    sendTrackingEvent({
      event: 'page_view',
      page_path: `${pathname}${searchStr}`,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [canShowMasaiverse, pathname, searchStr])

  if (!canShowMasaiverse) return null

  return (
    <MasaiverseV2Page>
      <Outlet />
    </MasaiverseV2Page>
  )
}
