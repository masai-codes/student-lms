'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { LearnBatchSwitcher } from '@/components/features/learn/section-one/LearnBatchSwitcher'
import { LearnTabSwitcher } from '@/components/features/learn/section-two/LearnTabSwitcher'
import type { LearnTab } from '@/components/features/learn/shared/types'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'
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
  const { user } = layoutRouteApi.useRouteContext()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDiscussions = pathname.startsWith('/learn/discussions')

  const lastSelectedBatchId = getLastSelectedBatchIdForUser(user.id)
  const lastSelectedBatchIdNumber = lastSelectedBatchId
    ? Number(lastSelectedBatchId)
    : undefined

  const { data } = useQuery({
    queryKey: ['learn-tier2-fallback-batches', lastSelectedBatchIdNumber],
    queryFn: () =>
      fetchLearnPageDataFromApi({
        batchId: lastSelectedBatchIdNumber,
        learningType: 'lecture',
        page: 1,
      }),
    staleTime: 5 * 60 * 1000,
  })

  if (!data) return null

  const batches = data.batches.map((batch) => ({
    value: batch.batchId.toString(),
    label: batch.courseTitle,
    courseLogo: batch.courseLogo,
    showBatchDetails: batch.showBatchDetails,
    showSectionDropdown: batch.showSectionDropdown,
  }))
  const selectedBatch = (data.selectedBatchId ?? '').toString()

  const handleTabChange = (tab: LearnTab) => {
    void navigate({
      to: '/learn',
      search: { tab, batchId: data.selectedBatchId ?? undefined },
    })
  }

  const handleBatchChange = (batchId: string) => {
    if (isDiscussions) {
      void navigate({
        to: '/learn/discussions',
        search: { batchId: Number(batchId) },
      })
      return
    }
    void navigate({ to: '/learn', search: { batchId: Number(batchId) } })
  }

  return (
    <>
      <div className="flex min-w-0 items-stretch gap-3">
        <LearnTabSwitcher
          activeTab="lectures"
          onTabChange={handleTabChange}
          variant="tier2"
        />
        {batches.length ? (
          <>
            <span
              aria-hidden="true"
              className="h-5 w-px shrink-0 self-center bg-border"
            />
            <div className="flex items-center">
              <LearnBatchSwitcher
                selectedBatch={selectedBatch}
                batches={batches}
                onBatchChange={handleBatchChange}
                compact
              />
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
