import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ProfileHeaderCard } from '@/components/features/profile/ProfileHeaderCard'
import { ProfileTabs } from '@/components/features/profile/ProfileTabs'
import { ProfileTabContent } from '@/components/features/profile/ProfileTabContent'
import { AchievementsPanel } from '@/components/features/profile/achievements/AchievementsPanel'
import { ProfileErrorState } from '@/components/features/profile/shared/ProfileStates'
import {
  resolveActiveProfileTab,
  resolveProfileTabs,
} from '@/components/features/profile/profileTabsConfig'
import type { ProfileTab } from '@/components/features/profile/profileTabsConfig'
import { profileOverviewQuery } from '@/query/profile/profileQueries'

const routeApi = getRouteApi('/(protected)/_layout/profile/')

/** Header skeleton that mirrors the real card's shape. */
function HeaderSkeleton() {
  return (
    <div
      data-testid="profile-header-skeleton"
      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-start md:gap-6 md:p-6"
    >
      <span className="sr-only">Loading…</span>
      <div className="dash-skeleton size-24 shrink-0 rounded-full" />
      <div className="w-full max-w-sm space-y-3">
        <div className="dash-skeleton h-6 w-2/3 rounded" />
        <div className="dash-skeleton h-4 w-1/2 rounded" />
        <div className="dash-skeleton h-4 w-1/3 rounded" />
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { tab } = routeApi.useSearch()
  const navigate = useNavigate()

  const { data: profile, isLoading, isError } = useQuery(profileOverviewQuery())

  const tabs = resolveProfileTabs(profile)
  const activeTab = resolveActiveProfileTab(tab, tabs)

  function selectTab(next: ProfileTab) {
    void navigate({ to: '/profile', search: { tab: next } })
  }

  return (
    <div className="mb-6 mt-4 flex flex-col gap-4">
      <h1 className="type-h5 text-foreground" data-testid="profile-page-title">
        My Profile
      </h1>

      {isLoading ? (
        <HeaderSkeleton />
      ) : isError || !profile ? (
        <ProfileErrorState
          testId="profile-overview-error"
          message="We couldn't load your profile. Please refresh and try again."
        />
      ) : (
        <ProfileHeaderCard profile={profile} />
      )}

      <AchievementsPanel />

      {profile ? (
        <>
          <ProfileTabs tabs={tabs} activeTab={activeTab} onSelect={selectTab} />
          <ProfileTabContent activeTab={activeTab} profile={profile} />
        </>
      ) : null}
    </div>
  )
}
