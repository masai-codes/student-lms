import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from './layout/DashboardLayout'
import { MOCK_DASHBOARD_DATA } from './shared/mockData'
import type { Announcement, WelcomeBanner } from './shared/types'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from '@/server/api/dashboard/announcements/announcementFeed'
import { fetchDashboardOverview } from '@/lib/api/dashboard/dashboardApi'

const OVERVIEW_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

function toWelcomeBanner(banner: DashboardBanner): WelcomeBanner {
  return {
    id: String(banner.id),
    title: banner.title,
    subtitle: banner.description ?? '',
  }
}

function toAnnouncement(item: DashboardAnnouncement): Announcement {
  return {
    id: `${item.source}-${item.id}`,
    title: item.title,
    author: item.authorName ?? '',
    isForYou: item.isForYou,
  }
}

// Feature entry point. Welcome banners and announcements are API-driven (via the
// consolidated dashboard overview endpoint); the remaining sections stay on mock
// data until they are migrated one by one.
export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    staleTime: OVERVIEW_STALE_TIME_MS,
  })

  const welcomeBanners = data
    ? data.banners.map(toWelcomeBanner)
    : MOCK_DASHBOARD_DATA.welcomeBanners
  const announcements = data
    ? data.announcements.map(toAnnouncement)
    : MOCK_DASHBOARD_DATA.announcements

  return (
    <DashboardLayout
      data={{ ...MOCK_DASHBOARD_DATA, welcomeBanners, announcements }}
    />
  )
}
