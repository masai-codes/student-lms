import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DashboardWelcomeSection } from '../section-welcome/DashboardWelcomeSection'
import { DashboardActionBanner } from '../section-banner/DashboardActionBanner'
import { DashboardBannerSection } from '../section-banner/DashboardBannerSection'
import { DashboardScheduleSection } from '../section-schedule/DashboardScheduleSection'
import { DashboardSidebarSection } from '../section-sidebar/DashboardSidebarSection'
import { DashboardActionBannerSkeleton } from '@/components/skeleton/dashboard/DashboardActionBannerSkeleton'
import { DashboardBannerSectionSkeleton } from '@/components/skeleton/dashboard/DashboardBannerSectionSkeleton'
import { DashboardScheduleSectionSkeleton } from '@/components/skeleton/dashboard/DashboardScheduleSectionSkeleton'
import { DashboardSidebarSectionSkeleton } from '@/components/skeleton/dashboard/DashboardSidebarSectionSkeleton'
import {
  fetchDashboardLeftSection,
  fetchDashboardRightSection,
} from '@/lib/api/dashboard/dashboardApi'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

export function DashboardLayout() {
  const { user } = layoutRouteApi.useRouteContext()

  const { data: rightSectionData } = useQuery({
    queryKey: ['dashboard-right-section'],
    queryFn: fetchDashboardRightSection,
    staleTime: 5 * 60 * 1000,
  })

  const { data: leftSectionData, isLoading: isLeftSectionLoading } = useQuery({
    queryKey: ['dashboard-left-section'],
    queryFn: fetchDashboardLeftSection,
    staleTime: 5 * 60 * 1000,
  })

  const actionBanners = leftSectionData?.actionBanners
  const isBannerVisible =
    actionBanners != null &&
    (actionBanners.pendingAgreementSections.length > 0 ||
      actionBanners.pendingFeedbackForms.length > 0 ||
      actionBanners.showZoom ||
      actionBanners.showDownloadApp)

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

  return (
    <div className="flex flex-col mx-4 mb-6 md:mx-8">
      {/* Action banner */}
      {isLeftSectionLoading
        ? <DashboardActionBannerSkeleton />
        : <DashboardActionBanner actionBanners={leftSectionData?.actionBanners} />}

      {/* Main dashboard card */}
      <div className={`relative z-10 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-6 ${isBannerVisible || isLeftSectionLoading ? '-mt-8' : 'mt-4'}`}>
        <div className="flex items-center gap-10">
          <div className="shrink-0">
            <DashboardWelcomeSection userName={user.name} />
          </div>
          <div className="ml-auto w-[60vw] min-w-0">
            {isLeftSectionLoading
              ? <DashboardBannerSectionSkeleton />
              : <DashboardBannerSection banners={leftSectionData?.banners ?? []} />}
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex-1 min-w-0">
            {isLeftSectionLoading
              ? <DashboardScheduleSectionSkeleton />
              : <DashboardScheduleSection
                  items={leftSectionData?.schedule ?? []}
                  isLoading={false}
                  pendingTasksCount={leftSectionData?.pendingTasksCount ?? 0}
                />}
          </div>

          <div className="w-full md:w-[360px] shrink-0">
            {rightSectionData == null
              ? <DashboardSidebarSectionSkeleton />
              : <DashboardSidebarSection
                  announcements={announcements}
                  productUpdates={productUpdates}
                  enrolledBatches={rightSectionData.batches}
                  attendanceData={rightSectionData.attendance}
                  lmsSupport={rightSectionData.lmsSupport}
                />}
          </div>
        </div>
      </div>
    </div>
  )
}
