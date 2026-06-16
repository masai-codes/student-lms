import {
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLoading } from '@/components/common'
import { AppMobileTabBar, AppNavbar } from '@/components/features/layout'
import MasaiverseMobileTabBar from '@/components/features/masaiverse-v2/MasaiverseMobileTabBar'
import { OnboardingModal } from '@/components/modals/onboarding/OnboardingModal'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { layoutMainClasses, layoutMainClassesFullWidth } from '@/lib/layout'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import { fetchDashboardLeftSection } from '@/lib/api/dashboard/dashboardApi'
import {
  getOldStudentUiUrlForPath,
  isLegacyStudentRedirectEnabled,
} from '@/utils/authRedirect'
import { initClarity, setCurrentUserForTracking } from '@/utils/tracking'

const AUTO_ONBOARDING_KEY = 'onboarding_modal_shown'

/** Paths served by this app when legacy redirect is enabled (everything else → old LMS). */
function isNewStudentExperienceRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname.startsWith('/masaiverse')) return true
  if (pathname.startsWith('/learn')) return true
  if (pathname.startsWith('/assignments')) return true
  if (pathname.startsWith('/lectures')) return true
  if (pathname.startsWith('/resources')) return true
  if (pathname.startsWith('/announcements')) return true
  if (pathname.startsWith('/bookmarks')) return true
  if (pathname.startsWith('/whats-new')) return true
  if (pathname.startsWith('/profile')) return true
  if (pathname.startsWith('/support')) return true
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

  const router = useRouter()
  const queryClient = useQueryClient()
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const { data: leftSectionData } = useQuery({
    queryKey: ['dashboard-left-section'],
    queryFn: fetchDashboardLeftSection,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!leftSectionData) return
    if (sessionStorage.getItem(AUTO_ONBOARDING_KEY)) return
    const { pendingAgreementSections, pendingFeedbackForms } = leftSectionData.actionBanners
    const hasBanners = pendingAgreementSections.length > 0 || pendingFeedbackForms.length > 0
    if (!hasBanners) return
    sessionStorage.setItem(AUTO_ONBOARDING_KEY, '1')
    setOnboardingOpen(true)
  }, [leftSectionData])

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
      {onboardingOpen && leftSectionData && (
        <OnboardingModal
          onClose={() => setOnboardingOpen(false)}
          showProfilePhoto={leftSectionData.actionBanners.showProfilePicture}
          agreementSections={leftSectionData.actionBanners.pendingAgreementSections}
          feedbackForms={leftSectionData.actionBanners.pendingFeedbackForms}
          onPhotoSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
            void router.invalidate()
          }}
          onAgreementSubmitted={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
          }}
        />
      )}
    </div>
  )
}
