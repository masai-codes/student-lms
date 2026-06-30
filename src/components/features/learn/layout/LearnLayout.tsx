import { useMemo } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnContentListSkeleton } from '../section-three/LearnContentListSkeleton'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import { useLearnPageState } from './useLearnPageState'
import type { LearnContentItem } from '../shared/types'
import type { GetLearnPageDataResponse } from '@/server/learn/types'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'

interface LearnLayoutProps {
  pageData: GetLearnPageDataResponse
  onBatchChange: (batchId: number) => void
}

export function LearnLayout({ pageData, onBatchChange }: LearnLayoutProps) {
  const {
    activeTab,
    currentPage,
    searchValue,
    modalFilters,
    filterCount,
    setActiveTab,
    setSearchValue,
    setCurrentPage,
    setModalFilters,
    setModules,
  } = useLearnPageState()

  // The route loader is the single source of page data; reflect its refetches.
  const isFetching = useRouterState({ select: (state) => state.isLoading })

  const enrolledBatches = pageData.batches
  const selectedBatchId = pageData.selectedBatchId

  const learningItems: Array<LearnContentItem> = useMemo(
    () =>
      pageData.learningItems.map((item) => ({
        id: item.id,
        type: item.learningType,
        title: item.title,
        hostName: item.hostName,
        date: item.scheduleDate,
        category: item.category,
        learningSubType: item.type,
        priority: item.isOptional,
        tags: [item.type, item.category, item.moduleName],
        attendance: item.attendance,
        assignmentProgressStatus: item.assignmentProgressStatus,
        resourcePhase: item.resourcePhase,
        listingCtas: item.listingCtas,
        assignmentStatusChip: item.listingCtas.assignmentStatusChip,
      })),
    [pageData.learningItems],
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
            moduleFilterOptions={pageData.filterValues.moduleFilterValues}
            categoryFilterOptions={pageData.filterValues.categoryFilterValues}
            typeFilterOptions={pageData.filterValues.typeFilterValues}
            instructorFilterOptions={
              pageData.filterValues.instructorFilterValues
            }
            modalFilters={modalFilters}
            onApplyModalFilters={setModalFilters}
          />
        </div>
      </div>

      {/* Only the content list reflects loading — header, tabs and search stay put. */}
      {isFetching ? (
        <LearnContentListSkeleton />
      ) : (
        <>
          <LearnContentListSection items={learningItems} />

          <LearnPaginationSection
            currentPage={currentPage}
            totalPages={pageData.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
