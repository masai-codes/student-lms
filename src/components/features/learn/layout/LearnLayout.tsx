import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import { createEmptyLearnModalFilters } from '../shared/types'
import type { LearnContentItem, LearnTab } from '../shared/types'
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
  const [activeTab, setActiveTab] = useState<LearnTab>('lectures')
  const [searchValue, setSearchValue] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalFilters, setModalFilters] = useState(createEmptyLearnModalFilters)

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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'learn-batch-learning-data',
      resolvedBatchId,
      learningType,
      searchValue,
      currentPage,
      modalFilters,
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
        pageSize: 10,
        filters: {
          modules: modalFilters.modules,
          categories: modalFilters.categories,
          types: modalFilters.types,
          priorities: modalFilters.priorities,
          instructors: modalFilters.instructors,
          scheduleStartDate: modalFilters.scheduleStartDate ?? undefined,
          scheduleEndDate: modalFilters.scheduleEndDate ?? undefined,
        },
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
      })),
    [data?.learningItems],
  )

  const moduleFilterNames = data?.filterValues.moduleFilterValues ?? []

  const totalPages = data?.pagination.totalPages ?? 1

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
              setCurrentPage(1)
            }}
          />

          <LearnControlsSection
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab)
              setCurrentPage(1)
            }}
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value)
              setCurrentPage(1)
            }}
            onModulesChange={(modules) => {
              setModalFilters((prev) => ({ ...prev, modules }))
              setCurrentPage(1)
            }}
            moduleFilterOptions={moduleFilterNames}
            categoryFilterOptions={
              data?.filterValues.categoryFilterValues ?? []
            }
            typeFilterOptions={data?.filterValues.typeFilterValues ?? []}
            instructorFilterOptions={
              data?.filterValues.instructorFilterValues ?? []
            }
            modalFilters={modalFilters}
            onApplyModalFilters={(next) => {
              setModalFilters(next)
              setCurrentPage(1)
            }}
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
