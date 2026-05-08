import { useMemo, useState } from 'react'
import { LearnHeaderSection } from '../section-one/LearnHeaderSection'
import { LearnControlsSection } from '../section-two/LearnControlsSection'
import { LearnFiltersModal } from '../section-two/filters-modal/LearnFiltersModal'
import { LearnContentListSection } from '../section-three/LearnContentListSection'
import { LearnPaginationSection } from '../section-four/LearnPaginationSection'
import {
  dummyContentByTab,
  dummyFilterOptions,
  moduleFilters,
} from '../shared/learnDummyData'
import type { LearnTab } from '../shared/types'

const ITEMS_PER_PAGE = 10

interface EnrolledBatchOption {
  batchId: number
  title: string
}

interface LearnLayoutProps {
  enrolledBatches: Array<EnrolledBatchOption>
}

export function LearnLayout({ enrolledBatches }: LearnLayoutProps) {
  const [selectedBatch, setSelectedBatch] = useState(
    enrolledBatches[0]?.batchId.toString() ?? '',
  )
  const [activeTab, setActiveTab] = useState<LearnTab>('lectures')
  const [searchValue, setSearchValue] = useState('')
  const [selectedModule, setSelectedModule] = useState(moduleFilters[0])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredItems = useMemo(() => {
    const tabItems = dummyContentByTab[activeTab]

    return tabItems.filter((item) => {
      const searchMatch =
        !searchValue ||
        item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.hostName.toLowerCase().includes(searchValue.toLowerCase())

      const moduleMatch =
        selectedModule === 'All Modules' || item.tags.includes(selectedModule)

      return searchMatch && moduleMatch
    })
  }, [activeTab, searchValue, selectedModule])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  )
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="w-full space-y-4">
      <LearnHeaderSection
        selectedBatch={selectedBatch}
        batches={enrolledBatches.map((batch) => ({
          value: batch.batchId.toString(),
          label: batch.title,
        }))}
        onBatchChange={setSelectedBatch}
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
        modules={moduleFilters}
        onModuleChange={(module) => {
          setSelectedModule(module)
          setCurrentPage(1)
        }}
        onOpenFilters={() => setIsFiltersOpen(true)}
      />

      <LearnContentListSection items={paginatedItems} />

      <LearnPaginationSection
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <LearnFiltersModal
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filterOptions={dummyFilterOptions}
      />
    </div>
  )
}
