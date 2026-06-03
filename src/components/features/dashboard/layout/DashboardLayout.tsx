import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { DashboardWelcomeSection } from '../section-welcome/DashboardWelcomeSection'
import { DashboardActionBanner } from '../section-banner/DashboardActionBanner'
import { DashboardBannerSection } from '../section-banner/DashboardBannerSection'
import { DashboardScheduleSection } from '../section-schedule/DashboardScheduleSection'
import { DashboardSidebarSection } from '../section-sidebar/DashboardSidebarSection'
import {
  fetchDashboardActionBanners,
  fetchDashboardAnnouncements,
  fetchDashboardAttendance,
  fetchDashboardPendingTasks,
  fetchDashboardSchedule,
  fetchProductUpdates,
} from '@/lib/api/dashboard/dashboardApi'
import { fetchEnrolledBatchesFromApi } from '@/lib/api/learn/learnApi'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

export function DashboardLayout() {
  const { user } = layoutRouteApi.useRouteContext()

  const { data: announcementsData } = useQuery({
    queryKey: ['dashboard-announcements'],
    queryFn: fetchDashboardAnnouncements,
  })

  const { data: productUpdatesData } = useQuery({
    queryKey: ['dashboard-product-updates'],
    queryFn: fetchProductUpdates,
  })

  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['dashboard-schedule'],
    queryFn: fetchDashboardSchedule,
  })

  const { data: actionBannersData } = useQuery({
    queryKey: ['dashboard-action-banners'],
    queryFn: fetchDashboardActionBanners,
  })

  const { data: pendingTasksData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['dashboard-pending-tasks'],
    queryFn: fetchDashboardPendingTasks,
  })

  const { data: enrolledBatches = [] } = useQuery({
    queryKey: ['enrolled-batches'],
    queryFn: fetchEnrolledBatchesFromApi,
    staleTime: 5 * 60 * 1000,
  })

  const { data: attendanceData = [] } = useQuery({
    queryKey: ['dashboard-attendance'],
    queryFn: fetchDashboardAttendance,
    staleTime: 5 * 60 * 1000,
  })

  const isBannerVisible =
    actionBannersData != null &&
    (actionBannersData.showAgreement ||
      actionBannersData.showFeedback ||
      actionBannersData.showZoom ||
      actionBannersData.showDownloadApp)

  const announcements = (announcementsData ?? []).map((item) => ({
    id: String(item.id),
    title: item.title,
    authorName: item.authorName ?? '',
    isForYou: item.isForYou,
  }))

  const productUpdates = (productUpdatesData ?? []).map((item) => ({
    id: String(item.id),
    description: item.description,
  }))

  return (
    <div className="flex flex-col mx-4 mb-6 md:mx-8">
      {/* Action banner — full rounded, sits behind the card */}
      <DashboardActionBanner />

      {/* Main dashboard card — overlaps banner when visible, otherwise sits below navbar with normal spacing */}
      <div className={`relative z-10 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-6 ${isBannerVisible ? '-mt-8' : 'mt-4'}`}>
        <div className="flex items-center gap-10">
          <div className="shrink-0">
            <DashboardWelcomeSection userName={user.name} />
          </div>
          <div className="ml-auto w-[60vw] min-w-0">
            <DashboardBannerSection />
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex-1 min-w-0">
            <DashboardScheduleSection
              items={scheduleData ?? []}
              pendingItems={pendingTasksData ?? []}
              isLoading={isScheduleLoading}
              isPendingLoading={isPendingLoading}
            />
          </div>

          <div className="w-full md:w-[360px] shrink-0">
            <DashboardSidebarSection
              announcements={announcements}
              productUpdates={productUpdates}
              enrolledBatches={enrolledBatches}
              attendanceData={attendanceData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
