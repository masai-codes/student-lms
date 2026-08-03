import { useEffect, useMemo, useRef } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnAppliedFilters } from '../section-two/LearnAppliedFilters'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnContentListSkeleton } from '../section-three/LearnContentListSkeleton'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import { useLearnPageState } from './useLearnPageState'
import type { LearnContentItem, LearnTab } from '../shared/types'
import type {
  GetLearnPageDataResponse,
  LearningType,
} from '@/server/learn/types'
import { learnScheduleHorizonToDays } from '../shared/types'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'
import { mapLearningItemToContent } from '../shared/mapLearningItemToContent'
import { getLastSelectedSectionIdForUser } from '@/lib/learnSectionSelection'

interface LearnLayoutProps {
  /** Loader-seeded initial page data; React Query takes over for interactive updates. */
  pageData: GetLearnPageDataResponse
  /** Signed-in user id — for per-batch section persistence. */
  userId: string | number
  /** `null` selects "Any section". */
  onSectionChange: (sectionId: number | null) => void
}

// Treat page data as fresh for 5 min (matches the dashboard/navbar convention) so
// returning to the tab doesn't refetch on window focus. The default staleTime of 0
// marks data stale immediately, which is what triggers a refetch on every focus.
const PAGE_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

function toLearningType(tab: LearnTab): LearningType {
  if (tab === 'assignments') return 'assignment'
  if (tab === 'resources') return 'resource'
  return 'lecture'
}

export function LearnLayout({
  pageData,
  userId,
  onSectionChange,
}: LearnLayoutProps) {
  const {
    activeTab,
    currentPage,
    searchValue,
    modalFilters,
    filterCount,
    apiFilters,
    batchId,
    sectionId,
    horizon,
    setActiveTab,
    setSearchValue,
    setCurrentPage,
    setSectionId,
    setHorizon,
    setModalFilters,
    setModules,
    clearAllFilters,
  } = useLearnPageState()

  const learningType = toLearningType(activeTab)
  const hasActiveApiFilters = Object.values(apiFilters).some(
    (value) => value != null && (!Array.isArray(value) || value.length > 0),
  )
  const scheduleHorizonDays = learnScheduleHorizonToDays(horizon)

  // Interactive updates fetch here (not via the route loader), so search / filters /
  // pagination never block the route — the header & search stay live and only the
  // list shows a skeleton while refetching.
  // Section and schedule-horizon are part of the key: they change what the API
  // returns, so a key that ignored them would serve another section's (or
  // another horizon's) cached list on switch instead of refetching.
  const queryKey = [
    'learn-page-data',
    batchId ?? null,
    sectionId ?? null,
    scheduleHorizonDays ?? null,
    learningType,
    searchValue,
    currentPage,
    hasActiveApiFilters ? apiFilters : null,
  ]

  // The route loader seeds `pageData` for the key it fetched (this first render).
  // Scope `initialData` to that exact key: TanStack applies `initialData` to every
  // new key with `dataUpdatedAt = now`, so without this a batch / filter / page
  // change would seed the new key with the *previous* batch's data and — because
  // `staleTime` marks it fresh on creation — show it without refetching. Other keys
  // start empty and fetch their own data (keepPreviousData keeps the old list
  // visible under a skeleton meanwhile).
  //
  // `Route.useLoaderData()` can itself lag: navigating back to `/learn` with a new
  // `tab` after visiting a detail page updates `useSearch()` (and so `learningType`)
  // immediately, but the router can replay the *previous* visit's cached loader data
  // for a render or two before the fresh loader result lands. Trusting that stale
  // `pageData` here would seed this tab's cache with the wrong content type and mark
  // it fresh, permanently masking the real fetch. Guard by checking the seeded
  // page's items actually match the tab we're about to render.
  const queryKeyString = JSON.stringify(queryKey)
  const seededKeyRef = useRef(queryKeyString)
  const pageDataMatchesTab =
    pageData.learningItems.length === 0 ||
    pageData.learningItems.every((item) => item.learningType === learningType)
  const isSeededKey =
    queryKeyString === seededKeyRef.current && pageDataMatchesTab

  const { data: queryData, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchLearnPageDataFromApi({
        batchId,
        learningType,
        search: searchValue.trim() || undefined,
        page: currentPage,
        filters: hasActiveApiFilters ? apiFilters : undefined,
        sectionId,
        scheduleHorizonDays,
      }),
    initialData: isSeededKey ? pageData : undefined,
    placeholderData: keepPreviousData,
    staleTime: PAGE_STALE_TIME_MS,
  })

  // `queryData` is only undefined in the impossible case of a non-seeded key with no
  // previous data; keepPreviousData otherwise keeps the last list in place while the
  // new one loads. The fallback keeps types honest without a non-null assertion.
  const data = queryData ?? pageData

  const enrolledBatches = data.batches
  const selectedBatchId = data.selectedBatchId
  const sections = data.sections

  // The section filter is opt-in per batch (`batches.meta.showSectionDropdown`).
  const showSectionDropdown =
    enrolledBatches.find((batch) => batch.batchId === selectedBatchId)
      ?.showSectionDropdown === true

  // Section persistence/restore. Runs only on data that matches the current batch
  // (guards against `keepPreviousData` showing the previous batch's sections):
  //  - with the filter hidden, any lingering `sectionId` is dropped so the listing
  //    is never narrowed by a control the student cannot see or reset;
  //  - a stale `sectionId` not in this batch's enrolled sections is dropped;
  //  - otherwise, when none is selected, restore this batch's stored choice.
  useEffect(() => {
    if (batchId == null || selectedBatchId !== batchId) return

    if (!showSectionDropdown) {
      if (sectionId != null) setSectionId(null)
      return
    }

    const validSectionIds = new Set(
      sections.map((section) => section.sectionId),
    )

    if (sectionId != null) {
      if (!validSectionIds.has(sectionId)) setSectionId(null)
      return
    }

    const storedSectionId = getLastSelectedSectionIdForUser(userId, batchId)
    if (storedSectionId != null && validSectionIds.has(storedSectionId)) {
      setSectionId(storedSectionId)
    }
  }, [
    batchId,
    selectedBatchId,
    sections,
    sectionId,
    setSectionId,
    showSectionDropdown,
    userId,
  ])

  const learningItems: Array<LearnContentItem> = useMemo(
    () => data.learningItems.map(mapLearningItemToContent),
    [data.learningItems],
  )

  if (selectedBatchId == null) {
    return null
  }

  return (
    <div className="w-full">
      <div className="relative lg:sticky lg:top-25.5 z-10 ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip -mt-6 bg-surface shadow-2xs py-4">
        <div className="animate-dash-rise layout-max-w layout-gutter-x relative mx-auto w-full">
          <LearnHeaderSection />

          <LearnControlsSection
            activeTab={activeTab}
            filterCount={filterCount}
            onTabChange={setActiveTab}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onModulesChange={setModules}
            moduleFilterOptions={data.filterValues.moduleFilterValues}
            categoryFilterOptions={data.filterValues.categoryFilterValues}
            typeFilterOptions={data.filterValues.typeFilterValues}
            instructorFilterOptions={data.filterValues.instructorFilterValues}
            modalFilters={modalFilters}
            onApplyModalFilters={setModalFilters}
            horizon={horizon}
            onHorizonChange={setHorizon}
            showSectionDropdown={showSectionDropdown}
            sections={sections}
            selectedSectionId={sectionId ?? null}
            onSectionChange={onSectionChange}
          />
        </div>
      </div>

      <LearnAppliedFilters
        filters={modalFilters}
        onChange={setModalFilters}
        onClearAll={clearAllFilters}
      />

      {/* Only the content list reflects loading — header, tabs and search stay put. */}
      {isFetching ? (
        <LearnContentListSkeleton />
      ) : (
        <>
          <div className="animate-dash-rise [--dash-delay:0.16s]">
            <LearnContentListSection items={learningItems} />
          </div>

          <div className="animate-dash-rise [--dash-delay:0.24s]">
            <LearnPaginationSection
              currentPage={currentPage}
              totalPages={data.pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
