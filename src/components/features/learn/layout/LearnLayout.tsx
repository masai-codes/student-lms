import { useMemo, useRef } from 'react'
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
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'
import { mapLearningItemToContent } from '../shared/mapLearningItemToContent'

interface LearnLayoutProps {
  /** Loader-seeded initial page data; React Query takes over for interactive updates. */
  pageData: GetLearnPageDataResponse
  onBatchChange: (batchId: number) => void
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

export function LearnLayout({ pageData, onBatchChange }: LearnLayoutProps) {
  const {
    activeTab,
    currentPage,
    searchValue,
    modalFilters,
    filterCount,
    apiFilters,
    batchId,
    setActiveTab,
    setSearchValue,
    setCurrentPage,
    setModalFilters,
    setModules,
    clearAllFilters,
  } = useLearnPageState()

  const learningType = toLearningType(activeTab)
  const hasActiveApiFilters = Object.values(apiFilters).some(
    (value) => value != null && (!Array.isArray(value) || value.length > 0),
  )

  // Interactive updates fetch here (not via the route loader), so search / filters /
  // pagination never block the route — the header & search stay live and only the
  // list shows a skeleton while refetching.
  const queryKey = [
    'learn-page-data',
    batchId ?? null,
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
  const queryKeyString = JSON.stringify(queryKey)
  const seededKeyRef = useRef(queryKeyString)
  const isSeededKey = queryKeyString === seededKeyRef.current

  const { data: queryData, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchLearnPageDataFromApi({
        batchId,
        learningType,
        search: searchValue.trim() || undefined,
        page: currentPage,
        filters: hasActiveApiFilters ? apiFilters : undefined,
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

  const learningItems: Array<LearnContentItem> = useMemo(
    () => data.learningItems.map(mapLearningItemToContent),
    [data.learningItems],
  )

  if (selectedBatchId == null) {
    return null
  }

  return (
    <div className="w-full mt-[-24px]">
      <div className="relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip bg-surface rounded-b-[32px]">
        {/* Ambient aurora wash behind the hero band — pure decoration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(52rem_14rem_at_12%_-4rem,rgb(79_70_229_/_0.07),transparent_70%),radial-gradient(44rem_12rem_at_88%_-6rem,rgb(63_131_248_/_0.07),transparent_70%)]"
        />
        <div
          className={`animate-dash-rise relative pt-[20px]  mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X}`}
        >
          <LearnHeaderSection
            selectedBatch={selectedBatchId.toString()}
            batches={enrolledBatches.map((batch) => ({
              value: batch.batchId.toString(),
              label: batch.courseTitle,
              courseLogo: batch.courseLogo,
              showBatchDetails: batch.showBatchDetails,
            }))}
            onBatchChange={(value) => {
              onBatchChange(Number(value))
            }}
          />

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
