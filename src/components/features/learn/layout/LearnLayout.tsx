import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLoading } from '@/components/common'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnFiltersModal } from '../section-two/filters-modal/LearnFiltersModal'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import type { LearnContentItem, LearnModalFiltersState, LearnTab } from '../shared/types'
import { getBatchLearningData } from '@/server/learn/getBatchLearningData'

interface EnrolledBatchOption {
  batchId: number
  courseTitle: string
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
  const [selectedModule, setSelectedModule] = useState('All Modules')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [modalFilters, setModalFilters] = useState<LearnModalFiltersState>({
    categories: [],
    types: [],
    priorities: [],
    instructors: [],
  })

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
      selectedModule,
      modalFilters,
    ],
    enabled: resolvedBatchId != null,
    queryFn: async () =>
      getBatchLearningData({
        data: {
          batchId: resolvedBatchId as number,
          learningType,
          search: searchValue.trim() || undefined,
          page: currentPage,
          pageSize: 10,
          filters: {
            modules: selectedModule === 'All Modules' ? [] : [selectedModule],
            categories: modalFilters.categories,
            types: modalFilters.types,
            priorities: modalFilters.priorities,
            instructors: modalFilters.instructors,
          },
        },
      }),
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
    [data?.learningItems]
  )

  const moduleOptions = useMemo(
    () => ['All Modules', ...(data?.filterValues.moduleFilterValues ?? [])],
    [data?.filterValues.moduleFilterValues]
  )

  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="w-full space-y-4">
      <LearnHeaderSection
        selectedBatch={(resolvedBatchId ?? '').toString()}
        batches={enrolledBatches.map((batch) => ({
          value: batch.batchId.toString(),
          label: batch.courseTitle,
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
        selectedModule={selectedModule}
        modules={moduleOptions}
        onModuleChange={(module) => {
          setSelectedModule(module)
          setCurrentPage(1)
        }}
        onOpenFilters={() => setIsFiltersOpen(true)}
      />

      {isLoading ? <AppLoading label="Loading learning items..." /> : null}
      {!isLoading ? <LearnContentListSection items={learningItems} /> : null}

      <LearnPaginationSection
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <LearnFiltersModal
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        categoryOptions={data?.filterValues.categoryFilterValues ?? []}
        typeOptions={data?.filterValues.typeFilterValues ?? []}
        instructorOptions={data?.filterValues.instructorFilterValues ?? []}
        selectedFilters={modalFilters}
        onApply={(nextFilters) => {
          setModalFilters(nextFilters)
          setCurrentPage(1)
        }}
      />
      {isFetching && !isLoading ? <AppLoading label="Refreshing..." /> : null}
    </div>
  )
}
