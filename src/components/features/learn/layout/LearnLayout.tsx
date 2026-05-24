import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import type { LearnContentItem } from '../shared/types'
import { useLearnPageState } from './useLearnPageState'
import { AppLoading } from '@/components/common'
import { fetchBatchLearningDataFromApi } from '@/lib/api/learn/learnApi'
import { LAYOUT_MAIN_PADDING_X, LAYOUT_MAX_WIDTH_CLASS } from '@/lib/layout'

interface EnrolledBatchOption {
  batchId: number
  courseTitle: string
  courseLogo: string | null
}

interface LearnLayoutProps {
  enrolledBatches: Array<EnrolledBatchOption>
  selectedBatchId?: number
  onBatchChange: (batchId: number) => void
}

export function LearnLayout({
  enrolledBatches,
  selectedBatchId,
  onBatchChange,
}: LearnLayoutProps) {
  const {
    activeTab,
    currentPage,
    searchValue,
    modalFilters,
    filterCount,
    apiFilters,
    setActiveTab,
    setSearchValue,
    setCurrentPage,
    setModalFilters,
    setModules,
  } = useLearnPageState()

  const resolvedBatchId = useMemo(() => {
    if (selectedBatchId != null) {
      return selectedBatchId
    }

    return enrolledBatches[0]?.batchId ?? null
  }, [enrolledBatches, selectedBatchId])

  const learningType = useMemo(() => {
    if (activeTab === 'lectures') return 'lecture' as const
    if (activeTab === 'assignments') return 'assignment' as const
    return 'resource' as const
  }, [activeTab])

  const hasActiveApiFilters = Object.values(apiFilters).some(
    (value) => value != null && (!(Array.isArray(value)) || value.length > 0),
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'learn-batch-learning-data',
      resolvedBatchId,
      learningType,
      searchValue,
      currentPage,
      apiFilters,
    ],
    enabled: typeof resolvedBatchId === 'number',
    queryFn: async () => {
      const batchId = resolvedBatchId
      if (typeof batchId !== 'number') {
        throw new Error('MISSING_BATCH_ID_FOR_LEARN_QUERY')
      }
      return fetchBatchLearningDataFromApi({
        batchId,
        learningType,
        search: searchValue.trim() || undefined,
        page: currentPage,
        pageSize: 15,
        filters: hasActiveApiFilters ? apiFilters : undefined,
      })
    },
  })

  const learningItems: Array<LearnContentItem> = useMemo(
    () =>
      (data?.learningItems ?? []).map((item) => ({
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
    [data?.learningItems],
  )

  const moduleFilterNames = data?.filterValues.moduleFilterValues ?? []
  const totalPages = data?.pagination.totalPages ?? 1

  if (resolvedBatchId == null) {
    return null
  }

  return (
    <div className="w-full mt-[-24px]">
      <div className="ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip bg-white rounded-b-[32px]">
        <div
          className={`pt-[20px]  mx-auto w-full ${LAYOUT_MAX_WIDTH_CLASS} ${LAYOUT_MAIN_PADDING_X}`}
        >
          <LearnHeaderSection
            selectedBatch={resolvedBatchId.toString()}
            batches={enrolledBatches.map((batch) => ({
              value: batch.batchId.toString(),
              label: batch.courseTitle,
              courseLogo: batch.courseLogo,
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
            moduleFilterOptions={moduleFilterNames}
            categoryFilterOptions={
              data?.filterValues.categoryFilterValues ?? []
            }
            typeFilterOptions={data?.filterValues.typeFilterValues ?? []}
            instructorFilterOptions={
              data?.filterValues.instructorFilterValues ?? []
            }
            modalFilters={modalFilters}
            onApplyModalFilters={setModalFilters}
          />
        </div>
      </div>

      {isLoading ? <AppLoading label="Loading learning items..." /> : null}
      {!isLoading ? <LearnContentListSection items={learningItems} /> : null}

      <LearnPaginationSection
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {isFetching && !isLoading ? <AppLoading label="Refreshing..." /> : null}
    </div>
  )
}
