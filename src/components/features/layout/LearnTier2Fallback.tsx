'use client'

import {
  getRouteApi,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { LearnTabSwitcher } from '@/components/features/learn/section-two/LearnTabSwitcher'
import type { LearnTab } from '@/components/features/learn/shared/types'
import { getLastSelectedBatchIdForUser } from '@/lib/learnBatchSelection'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

/**
 * Tier 2's Lectures/Assignments/Resources tabs and program switcher are
 * normally portaled in by the `/learn` listing page itself. On every other
 * Learn-scoped page (lecture/assignment/resource detail, `/learn/discussions`)
 * nothing portals into those slots, so this renders an equivalent, fully
 * functional standalone version instead of leaving them empty.
 */
export function LearnTier2Fallback() {
  const navigate = useNavigate()
  const { user } = layoutRouteApi.useRouteContext()
  const lastSelectedBatchId = getLastSelectedBatchIdForUser(user.id)
  const lastSelectedBatchIdNumber = lastSelectedBatchId
    ? Number(lastSelectedBatchId)
    : undefined
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const learnItems: LearnTab[] = ['assignments', 'resources', 'lectures']
  const tabQuery = useRouterState({ select: (s) => s.location.search.tab })
  const selectedTab: LearnTab | undefined =
    tabQuery && learnItems.map((i) => i as string).includes(tabQuery)
      ? (tabQuery as LearnTab)
      : undefined
  const isDiscussions = pathname.startsWith('/learn/discussions')
  const activeTab: LearnTab | undefined = isDiscussions
    ? undefined
    : selectedTab
      ? selectedTab
      : pathname.startsWith('/learn/assignments')
        ? 'assignments'
        : pathname.startsWith('/learn/resources')
          ? 'resources'
          : 'lectures'

  const handleTabChange = (tab: LearnTab) => {
    void navigate({
      to: '/learn',
      search: { tab, batchId: lastSelectedBatchIdNumber ?? undefined },
    })
  }

  return (
    <>
      <div className="flex min-w-0 items-stretch gap-3">
        <LearnTabSwitcher
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="tier2"
        />
      </div>
    </>
  )
}
