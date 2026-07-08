import { useMemo } from 'react'
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
import {
  formatScheduleRangeIST,
  formatScheduleRangeLocal,
} from '@/utils/timeZoneHandler'

interface LearnLayoutProps {
  /** Loader-seeded initial page data; React Query takes over for interactive updates. */
  pageData: GetLearnPageDataResponse
  onBatchChange: (batchId: number) => void
}

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
  const { data, isFetching } = useQuery({
    queryKey: [
      'learn-page-data',
      batchId ?? null,
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
      }),
    initialData: pageData,
    placeholderData: keepPreviousData,
  })

  const enrolledBatches = data.batches
  const selectedBatchId = data.selectedBatchId

  const learningItems: Array<LearnContentItem> = useMemo(
    () =>
      data.learningItems.map((item) => ({
        id: item.id,
        type: item.learningType,
        title: item.title,
        hostName: item.hostName,
        date: formatScheduleRangeLocal(item.scheduleDate, item.concludes) || null,
        dateTooltip:
          formatScheduleRangeIST(item.scheduleDate, item.concludes) || null,
        category: item.category,
        learningSubType: item.type,
        priority: item.isOptional,
        tags: [item.type, item.category, item.moduleName],
        attendance: item.attendance,
        assignmentProgressStatus: item.assignmentProgressStatus,
        resourcePhase: item.resourcePhase,
        listingCtas: item.listingCtas,
        assignmentStatusChip: item.listingCtas.assignmentStatusChip,
        assignmentDeadlineLabel: item.listingCtas.assignmentDeadlineLabel,
      })),
    [data.learningItems],
  )

  if (selectedBatchId == null) {
    return null
  }

  return (
    <div className="w-full mt-[-24px]">
      <div className="ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip bg-white rounded-b-[32px]">
        <div
          className={`pt-[20px]  mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X}`}
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
          <LearnContentListSection items={learningItems} />

          <LearnPaginationSection
            currentPage={currentPage}
            totalPages={data.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
