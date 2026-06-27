import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowRight, ListChecks, Megaphone } from 'lucide-react'
import { OnboardingModal } from '@/components/modals/onboarding/OnboardingModal'
import { T0FlowModal } from '@/components/modals/t0Flow/T0FlowModal'
import { AnnouncementPopupModal, filterUnshownPopups } from '@/components/modals/AnnouncementPopupModal'
import { WelcomeModal } from '@/components/modals/WelcomeModal'
import { DashboardWelcomeSection } from '../section-welcome/DashboardWelcomeSection'
import { DashboardActionBanner } from '../section-banner/DashboardActionBanner'
import { DashboardBannerSection } from '../section-banner/DashboardBannerSection'
import { PaymentBanner } from '../section-banner/PaymentBanner'
import { DashboardScheduleSection } from '../section-schedule/DashboardScheduleSection'
import { DashboardSidebarSection } from '../section-sidebar/DashboardSidebarSection'
import { LmsSupportPanel } from '../section-sidebar/LmsSupportPanel'
import { DashboardActionBannerSkeleton } from '@/components/skeleton/dashboard/DashboardActionBannerSkeleton'
import { DashboardBannerSectionSkeleton } from '@/components/skeleton/dashboard/DashboardBannerSectionSkeleton'
import { DashboardScheduleSectionSkeleton } from '@/components/skeleton/dashboard/DashboardScheduleSectionSkeleton'
import { DashboardSidebarSectionSkeleton } from '@/components/skeleton/dashboard/DashboardSidebarSectionSkeleton'
import { fetchAnnouncementUnreadCount } from '@/lib/api/announcement/announcementApi'
import {
  fetchDashboardLeftSection,
  fetchDashboardRightSection,
  fetchT0FlowStatus,
  fetchWelcomeModalStatus,
  dismissWelcomeModalApi,
  fetchPaymentBannerInfo,
} from '@/lib/api/dashboard/dashboardApi'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

export function DashboardLayout() {
  const { user } = layoutRouteApi.useRouteContext()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Payment banner fetched first — all other dashboard queries wait for this to resolve.
  // If banned, every subsequent query stays disabled permanently.
  const { data: paymentBanner, isSuccess: paymentBannerResolved } = useQuery({
    queryKey: ['payment-banner'],
    queryFn: fetchPaymentBannerInfo,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  const isBanned = paymentBanner?.type === 'banned'
  const dashboardEnabled = paymentBannerResolved && !isBanned

  const { data: t0FlowStatus } = useQuery({
    queryKey: ['t0-flow-status'],
    queryFn: fetchT0FlowStatus,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: dashboardEnabled,
  })

  const { data: welcomeModalStatus } = useQuery({
    queryKey: ['welcome-modal-status'],
    queryFn: fetchWelcomeModalStatus,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: dashboardEnabled,
  })

  const [t0FlowDismissed, setT0FlowDismissed] = useState(false)
  const t0FlowOpen = !t0FlowDismissed && (t0FlowStatus?.showT0Flow ?? false)

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [showPopups, setShowPopups] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['announcement-unread-count'],
    queryFn: fetchAnnouncementUnreadCount,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: dashboardEnabled,
  })

  const { data: rightSectionData } = useQuery({
    queryKey: ['dashboard-right-section'],
    queryFn: fetchDashboardRightSection,
    staleTime: 5 * 60 * 1000,
    enabled: dashboardEnabled,
  })

  const { data: leftSectionData, isLoading: isLeftSectionLoading } = useQuery({
    queryKey: ['dashboard-left-section'],
    queryFn: fetchDashboardLeftSection,
    staleTime: 5 * 60 * 1000,
    enabled: dashboardEnabled,
  })

  // Opens welcome modal if eligible, otherwise falls through to announcement popups.
  // Called after T0Flow (when no onboarding) and after Onboarding closes.
  function openWelcomeOrPopups() {
    if (welcomeModalStatus?.showWelcomeModal) {
      setWelcomeOpen(true)
    } else {
      setShowPopups(true)
    }
  }

  // Initial trigger when T0Flow is not shown — waits for all status data to load.
  useEffect(() => {
    if (!leftSectionData || t0FlowOpen || t0FlowStatus === undefined || welcomeModalStatus === undefined) return
    const { pendingAgreementSections, pendingFeedbackForms } = leftSectionData.actionBanners
    if (pendingAgreementSections.length > 0 || pendingFeedbackForms.length > 0) {
      setOnboardingOpen(true)
    } else if (welcomeModalStatus.showWelcomeModal) {
      setWelcomeOpen(true)
    } else {
      setShowPopups(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSectionData, t0FlowOpen, t0FlowStatus, welcomeModalStatus])

  const handleAnnouncementsClick = useCallback(() => {
    void navigate({ to: '/announcements', search: { page: 1 } })
  }, [navigate])

  const actionBanners = leftSectionData?.actionBanners
  const isBannerVisible =
    actionBanners != null &&
    (actionBanners.pendingAgreementSections.length > 0 ||
      actionBanners.pendingFeedbackForms.length > 0 ||
      actionBanners.showDownloadApp ||
      actionBanners.showProfilePicture)

  const pendingPopups = useMemo(
    () => filterUnshownPopups(
      (rightSectionData?.announcements ?? []).map((item) => ({
        id: String(item.id),
        source: item.source,
        title: item.title,
        body: item.body,
        ctaName: item.ctaName,
        ctaLink: item.ctaLink,
      })),
    ),
    [rightSectionData?.announcements],
  )

  const announcements = (rightSectionData?.announcements ?? []).map((item) => ({
    id: String(item.id),
    title: item.title,
    authorName: item.authorName ?? '',
    isForYou: item.isForYou,
  }))

  const productUpdates = (rightSectionData?.productUpdates ?? []).map((item) => ({
    id: String(item.id),
    description: item.description,
  }))

  const scheduleSection = isLeftSectionLoading
    ? <DashboardScheduleSectionSkeleton />
    : <DashboardScheduleSection
        items={leftSectionData?.schedule ?? []}
        isLoading={false}
        pendingTasksCount={leftSectionData?.pendingTasksCount ?? 0}
        queryEnabled={dashboardEnabled}
      />

  const bannerSection = isLeftSectionLoading
    ? <DashboardBannerSectionSkeleton />
    : <DashboardBannerSection banners={leftSectionData?.banners ?? []} />

  const actionBannerSection = isLeftSectionLoading
    ? <DashboardActionBannerSkeleton />
    : <DashboardActionBanner actionBanners={leftSectionData?.actionBanners} />

  const sidebarSection = !isBanned && rightSectionData == null
    ? <DashboardSidebarSectionSkeleton />
    : <DashboardSidebarSection
        announcements={announcements}
        productUpdates={productUpdates}
        enrolledBatches={rightSectionData?.batches ?? []}
        attendanceData={rightSectionData?.attendance ?? []}
        lmsSupport={rightSectionData?.lmsSupport}
        showLmsSupport={!isBanned}
      />

  return (
    <>
      {/* ── Mobile / Tablet layout (< lg) ── */}
      <div className="lg:hidden flex flex-col pb-40 -mx-1 -mt-6">
        {/* Welcome header bar */}
        <div className="bg-white rounded-b-[24px] px-4 py-3 flex items-center justify-between min-h-[72px]">
          <div className="flex flex-col">
            <span className="text-sm font-normal text-[#544D4F]">Welcome</span>
            <span className="text-lg font-semibold text-[#21191B]">{user.name} 👋🏻</span>
          </div>
          <button
            type="button"
            onClick={handleAnnouncementsClick}
            aria-label="Announcements"
            className="relative flex items-center justify-center size-12 rounded-[8px] text-gray-500"
          >
            <Megaphone className="size-7 -scale-x-100" />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#F05252] font-poppins text-[11px] font-medium leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>


<div className="flex flex-col gap-4 px-4 mt-3">
          {paymentBanner && (
            <PaymentBanner info={paymentBanner} />
          )}
          {actionBannerSection}
          {bannerSection}
          {scheduleSection}
          {!isBanned && <LmsSupportPanel info={rightSectionData?.lmsSupport} />}
        </div>

        {/* Footer */}
        <div className="px-4 mt-8 flex flex-col select-none">
          <span className="font-poppins font-semibold text-[64px] leading-[72px] text-[#CCCCCC]">Go</span>
          <span className="font-poppins font-semibold text-[64px] leading-[72px] text-[#CCCCCC]">beyond!</span>
          <span className="font-poppins font-medium text-base leading-6 text-[#B3B3B3] mt-2">Crafted with ❤️ by Masai</span>
        </div>
      </div>

      {/* ── Desktop layout (≥ lg) ── */}
      <div className="hidden lg:flex flex-col w-full max-w-[1440px] mx-auto mb-6 px-6">
        {/* Payment banner — above the action banner */}
        {paymentBanner && (
          <div className="mb-3">
            <PaymentBanner info={paymentBanner} />
          </div>
        )}

        {/* Action banner — sits behind the white card */}
        {actionBannerSection}

        {/* White card — z-10 places it on top of the banner */}
        <div className={`relative z-10 rounded-3xl border border-gray-200 bg-white flex flex-col ${isBannerVisible || isLeftSectionLoading ? '-mt-10' : 'mt-4'}`}>
          {/* Header row: welcome + banner */}
          <div className="flex items-start gap-4 px-8 pt-8 pb-0">
            <div className="shrink-0 mt-2">
              <DashboardWelcomeSection userName={user.name} />
            </div>
            <div className="w-3/5 min-w-0 shrink-0 ml-auto">
              {bannerSection}
            </div>
          </div>

          {/* Content row: schedule + sidebar */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start px-8 pt-7 pb-8">
            <div className="flex-1 min-w-0">
              {scheduleSection}
            </div>
            <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-4">
              {t0FlowStatus?.showT0Flow && !t0FlowOpen && (
                <button
                  type="button"
                  onClick={() => setT0FlowDismissed(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-left focus-visible:outline-none hover:opacity-90 transition-opacity"
                  style={{ background: '#EBF5FF', border: '1px solid #C3DDFD' }}
                >
                  <span className="flex items-center justify-center size-8 rounded-lg shrink-0" style={{ background: '#BFDBFE' }}>
                    <ListChecks size={16} style={{ color: '#6962AC' }} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-[#1E429F]" style={{ fontFamily: 'Poppins' }}>
                    Complete program onboarding
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{ background: '#fff', color: '#6962AC', border: '1px solid #C3DDFD', fontFamily: 'Poppins' }}>
                    Continue <ArrowRight size={14} />
                  </span>
                </button>
              )}
              {sidebarSection}
            </div>
          </div>
        </div>
      </div>

      {/* Modal stack: T0Flow → Onboarding → Welcome → Popups */}

      {t0FlowOpen && (
        <T0FlowModal
          batches={t0FlowStatus?.batches ?? []}
          profilePhotoUrl={t0FlowStatus?.profilePhotoUrl ?? null}
          downloadAppCompleted={t0FlowStatus?.downloadAppCompleted ?? false}
          paymentBanner={paymentBanner}
          onPhotoSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
            void router.invalidate()
          }}
          onAgreementSubmitted={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
            void queryClient.invalidateQueries({ queryKey: ['t0-flow-lectures'] })
          }}
          onClose={() => {
            setT0FlowDismissed(true)
            if (!leftSectionData) return
            const { pendingAgreementSections, pendingFeedbackForms } = leftSectionData.actionBanners
            if (pendingAgreementSections.length > 0 || pendingFeedbackForms.length > 0) {
              setOnboardingOpen(true)
            } else {
              openWelcomeOrPopups()
            }
          }}
        />
      )}

      {!t0FlowOpen && onboardingOpen && leftSectionData && (
        <OnboardingModal
          onClose={() => { setOnboardingOpen(false); openWelcomeOrPopups() }}
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
          onFeedbackSubmitted={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
          }}
          onAssessCompleted={() => {
            void queryClient.invalidateQueries({ queryKey: ['dashboard-left-section'] })
          }}
        />
      )}

      {!t0FlowOpen && !onboardingOpen && welcomeOpen && (
        <WelcomeModal
          onClose={() => {
            setWelcomeOpen(false)
            void dismissWelcomeModalApi()
            setShowPopups(true)
          }}
        />
      )}

      {showPopups && pendingPopups.length > 0 && (
        <AnnouncementPopupModal
          popups={pendingPopups}
          onDone={() => setShowPopups(false)}
          onMarkedRead={() => void queryClient.invalidateQueries({ queryKey: ['dashboard-right-section'] })}
        />
      )}

      {/* Sticky bottom banner — shown when T0Flow tasks are pending and modal is closed */}
      {t0FlowStatus?.showT0Flow && !t0FlowOpen && (
        <div className="fixed bottom-24 lg:bottom-0 inset-x-0 z-[201] pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pb-3 lg:pb-4">
            <div
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
              style={{ background: '#EBF5FF', border: '1px solid #C3DDFD' }}
            >
              <span className="flex items-center justify-center size-8 rounded-lg shrink-0" style={{ background: '#BFDBFE' }}>
                <ListChecks size={16} style={{ color: '#6962AC' }} />
              </span>
              <span className="flex-1 text-sm font-semibold text-[#1E429F]" style={{ fontFamily: 'Poppins' }}>
                Complete program onboarding
              </span>
              <button
                type="button"
                onClick={() => setT0FlowDismissed(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none"
                style={{ background: '#fff', color: '#6962AC', fontFamily: 'Poppins', border: '1px solid #C3DDFD' }}
              >
                Continue
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
