import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLoading, FloatingChatProvider } from '@/components/common'
import {
  AppMobileHeader,
  AppMobileTabBar,
  AppNavbar,
  SupportChatButton,
} from '@/components/features/layout'
import { TryNewTour } from '@/components/features/layout/TryNewTour'
import { AnnouncementModalController, ModalProvider } from '@/components/modals'
import MasaiverseMobileTabBar from '@/components/features/masaiverse-v2/MasaiverseMobileTabBar'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { ME_QUERY_KEY } from '@/query/me/meCache'
import { meQuery } from '@/query/me/meQuery'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import {
  getOldStudentUiUrlForPath,
  isLegacyStudentRedirectEnabled,
} from '@/utils/authRedirect'
import { mapToLegacyPath } from '@/utils/legacyPathMap'
import { isMigratedRoute } from '@/utils/migratedRoutes'
import { initClarity, setCurrentUserForTracking } from '@/utils/tracking'

/** Hardcoded kill-switch for the new floating support chat. Flip to `false` to fall back to the old /support button. */
const ENABLE_SUPPORT_FLOATER = true

/** Paths served by this app when legacy redirect is enabled (everything else → old LMS). */
/**
 * Paths served by this app when legacy redirect is enabled (everything else →
 * old LMS). Deliberately minimal: only the migrated pages (flag-gated, handled
 * separately) plus `masaiverse`, `support` and `interviews` stay on the new LMS.
 * Everything else — profile, my-courses, course, etc. — redirects to the old LMS.
 *
 * `support` is also a migrated route: the flag decides which app the *old* LMS
 * sends the student to, but on this side it is always served — `/support` (and
 * `/support/context`) is embedded in an old-LMS iframe, so an opted-out student
 * must never be redirected back out of it. `chat` is purely flag-gated, like
 * Dashboard and Learn.
 */
function isNewStudentExperienceRoute(pathname: string): boolean {
  if (pathname.startsWith('/masaiverse')) return true
  if (pathname === '/support' || pathname.startsWith('/support/')) {
    return true
  }
  if (pathname === '/interviews' || pathname.startsWith('/interviews/')) {
    return true
  }
  return false
}

/** Lecture, assignment, and resource detail pages use in-header Raise Ticket instead. */
function shouldHideSupportIcon(pathname: string): boolean {
  return (
    /^\/learn\/(lectures|assignments|resources)\/[^/]+/.test(pathname) ||
    /^\/(interviews\/|chat)/.test(pathname)
  )
}

/** Live interview session screen is a full-screen, single-task surface — no
 * navbar/tab bar chrome, same treatment as chat/masaiverse/lecture detail. */
function isInterviewSessionRoute(pathname: string): boolean {
  return /^\/interviews\/[^/]+$/.test(pathname)
}

export const Route = createFileRoute('/(protected)/_layout')({
  beforeLoad: async ({ context, location }) => {
    const shouldRedirectToLegacy = isLegacyStudentRedirectEnabled()
    const isMasaiverseRoute = location.pathname.startsWith('/masaiverse')
    const requestUrl = new URL(location.href, 'http://localhost')
    const token = requestUrl.searchParams.get('token')

    // `beforeLoad` re-runs on every navigation under this layout, so this must
    // come from the cache: called directly, the server function was an RPC per
    // page change that blocked navigation for up to ~1.3s (issue #354). Primed
    // during SSR, streamed into the client, then reused for `ME_STALE_TIME`.
    let user = await context.queryClient.ensureQueryData(meQuery())

    // Auto-login fallback: on any route, when there's no session yet but the
    // request carries a `?token=` (legacy/app hands the session off via the
    // URL). Verifying it persists the session cookie so later requests are
    // authed. The `?token=` is stripped from the URL below once consumed.
    if (!user && token) {
      user = await bootstrapLoginWithToken({ data: token })
      // Overwrite the `null` just cached, or the redirect below would re-read it
      // and bounce this now-authenticated request to /signin.
      context.queryClient.setQueryData(ME_QUERY_KEY, user)
    }

    if (!user) {
      throw redirect({ to: '/signin' })
    }

    // Right session, wrong portal domain (bookmark, shared link, old handoff):
    // hand the student to the portal their `users.client` says they belong to.
    // Runs before any legacy-redirect logic so we never bounce them through the
    // wrong portal's old LMS on the way. Admins are exempt (resolved server-side).
    if (user.portalRedirectUrl) {
      throw redirect({ href: user.portalRedirectUrl })
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

    if (shouldRedirectToLegacy) {
      const url = new URL(location.href, 'http://localhost')

      // The migrated routes ignore the static allowlist: the per-user flag
      // decides. Opted in → stay here; opted out → old LMS. Every other route
      // keeps the existing allowlist behaviour.
      //
      // Exception: a route that is both migrated *and* allowlisted (support,
      // chat) is always served here — the old LMS embeds this app's `/support`
      // in an iframe, so an opted-out student must not be bounced back (the old
      // page would just re-embed us). For those the migrated listing only drives
      // the old LMS hand-off and the "Try New" toggle.
      const isAlwaysServedHere = isNewStudentExperienceRoute(location.pathname)
      const shouldRedirectMigratedRoute =
        isMigratedRoute(location.pathname) &&
        !user.newLmsPagesEnabled &&
        !isAlwaysServedHere
      const shouldRedirectOtherRoute =
        !isMigratedRoute(location.pathname) && !isAlwaysServedHere

      if (shouldRedirectMigratedRoute || shouldRedirectOtherRoute) {
        // Migrated pages hand off path-only — the old LMS regenerates its own
        // query params (batch/tab/page). Other legacy routes keep their search.
        // Both translate the path where the old-LMS route differs (e.g. this
        // app's `/learn/discussions` is `/discussions` over there).
        const pathForLegacy = shouldRedirectMigratedRoute
          ? mapToLegacyPath(url.pathname)
          : `${mapToLegacyPath(url.pathname)}${url.search}`
        const oldUiUrl = getOldStudentUiUrlForPath(pathForLegacy)
        if (oldUiUrl) {
          throw redirect({ href: oldUiUrl })
        }
      }
    }
    // One-time bootstrap tokens must not linger in the URL (browser history,
    // server logs, Referer). Once the session cookie is set and we've decided
    // to stay on this app, drop `?token=` and send the browser to the clean URL.
    if (token) {
      const cleanParams = new URLSearchParams(requestUrl.searchParams)
      cleanParams.delete('token')
      const cleanSearch = cleanParams.toString()
      throw redirect({
        href: `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`,
        replace: true,
      })
    }

    return {
      user,
    }
  },
  component: RouteComponent,
  pendingComponent: () => <AppLoading fullPage label="Loading workspace..." />,
})

function RouteComponent() {
  const { searchStr, pathname, renderedPathname } = useRouterState({
    select: (state) => ({
      searchStr: state.location.searchStr,
      pathname: state.location.pathname,
      // During a pending navigation `location` is already the destination while
      // the outgoing route is still painted. Width classes must follow what's
      // on screen, or the old page flashes in the new page's shell (e.g. the
      // learn listing going edge-to-edge for a beat on the way to a lecture).
      renderedPathname: (state.resolvedLocation ?? state.location).pathname,
    }),
  })
  const { user } = Route.useRouteContext()
  const isApp = isMasaiverseApp(searchStr)
  const isMasaiverseRoute = pathname.startsWith('/masaiverse')
  const isSupportRoute = pathname.startsWith('/support')
  // Lecture detail spans the full viewport width (no centered container), so
  // every hero state is edge-to-edge like the recording video.
  const isLectureDetail = /^\/learn\/lectures\/[^/]+/.test(renderedPathname)
  // Chat is a single full-bleed iframe (connect.masaischool.com) — it wants
  // the full viewport width/height, same as Masaiverse and lecture detail.
  const isChatRoute = renderedPathname.startsWith('/chat')
  const isDashboard = renderedPathname === '/'
  const mainClasses =
    renderedPathname.startsWith('/masaiverse') || isChatRoute || isDashboard
      ? 'layout-full-width-main'
      : isLectureDetail
        ? 'layout-lecture-main'
        : 'layout-page'

  useEffect(() => {
    initClarity()
  }, [])

  useEffect(() => {
    setCurrentUserForTracking(user)
  }, [user])

  if (isSupportRoute) {
    return (
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    )
  }

  if (isInterviewSessionRoute(renderedPathname)) {
    return (
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    )
  }

  // Masaiverse gets the same support surface as every other page: the provider
  // is mounted there too, so the navbar's Support tab opens the floating chat
  // drawer instead of falling back to a full-page navigation to /support.
  const showFloatingChat = ENABLE_SUPPORT_FLOATER && !isSupportRoute
  const showFloatingChatSphere =
    showFloatingChat && !shouldHideSupportIcon(renderedPathname)

  // `data-app-shell`: hook target for the lecture page viewport lock (styles.css).
  const layout = (
    <div data-app-shell className="layout-app-shell">
      <TryNewTour hasSeen={user.hasSeenTryNewTour || user.hideSwitchOption} />
      <AppNavbar />
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
      {!ENABLE_SUPPORT_FLOATER &&
      pathname === '/' &&
      !isMasaiverseRoute &&
      !isSupportRoute ? (
        <SupportChatButton />
      ) : null}
      <AnnouncementModalController />
    </div>
  )

  return (
    <ModalProvider>
      {showFloatingChat ? (
        <FloatingChatProvider showSphere={showFloatingChatSphere}>
          {layout}
        </FloatingChatProvider>
      ) : (
        layout
      )}
    </ModalProvider>
  )
}
