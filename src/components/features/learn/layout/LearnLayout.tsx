import { useEffect, useMemo } from 'react'
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
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'
import { mapLearningItemToContent } from '../shared/mapLearningItemToContent'
import { getLastSelectedSectionIdForUser } from '@/lib/learnSectionSelection'

interface LearnLayoutProps {
  /** Loader-seeded initial page data; React Query takes over for interactive updates. */
  pageData: GetLearnPageDataResponse
  /** Signed-in user id — for per-batch section persistence. */
  userId: string | number
  onBatchChange: (batchId: number) => void
  /** `null` selects "Any section". */
  onSectionChange: (sectionId: number | null) => void
}

function toLearningType(tab: LearnTab): LearningType {
  if (tab === 'assignments') return 'assignment'
  if (tab === 'resources') return 'resource'
  return 'lecture'
}

export function LearnLayout({
  pageData,
  userId,
  onBatchChange,
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
  const { data, isFetching } = useQuery({
    queryKey: [
      'learn-page-data',
      batchId ?? null,
      sectionId ?? null,
      scheduleHorizonDays ?? null,
      learningType,
      searchValue,
      currentPage,
      hasActiveApiFilters ? apiFilters : null,
    ],
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
    initialData: pageData,
    placeholderData: keepPreviousData,
  })

  const enrolledBatches = data.batches
  const selectedBatchId = data.selectedBatchId
  const sections = data.sections

  // Section persistence/restore. Runs only on data that matches the current batch
  // (guards against `keepPreviousData` showing the previous batch's sections):
  //  - a stale `sectionId` not in this batch's enrolled sections is dropped;
  //  - otherwise, when none is selected, restore this batch's stored choice.
  useEffect(() => {
    if (batchId == null || selectedBatchId !== batchId) return
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
  }, [batchId, selectedBatchId, sections, sectionId, setSectionId, userId])

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
            sections={sections}
            selectedSectionId={sectionId ?? null}
            onSectionChange={onSectionChange}
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
            horizon={horizon}
            onHorizonChange={setHorizon}
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
