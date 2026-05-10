'use client'

import { useMemo, useState } from 'react'

import { Filter, Search } from 'lucide-react'

import { LearnFiltersPanel } from './filters-modal/LearnFiltersPanel'
import type { LearnModalFiltersState, LearnTab } from '../shared/types'

import type { MasaiDropdownCheckboxFilterOption } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiDropdownCheckboxFilter } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiButton } from '@/components/masai-button'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { MasaiInput } from '@/components/ui/masai-input'
import { MasaiTab } from '@/components/ui/masai-tab'

const LEARN_TAB_ICON_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/tab-icon.svg'

const LEARN_TAB_ITEMS: ReadonlyArray<{ value: LearnTab; label: string }> = [
  { value: 'lectures', label: 'Lectures' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'resources', label: 'Resources' },
]

const SEARCH_PLACEHOLDER_BY_TAB: Record<LearnTab, string> = {
  lectures: 'Search lectures',
  assignments: 'Search assignments',
  resources: 'Search resources',
}

interface LearnControlsSectionProps {
  activeTab: LearnTab
  onTabChange: (tab: LearnTab) => void
  searchValue: string
  onSearchChange: (value: string) => void
  moduleFilterOptions: Array<string>
  categoryFilterOptions: Array<string>
  typeFilterOptions: Array<string>
  instructorFilterOptions: Array<string>
  modalFilters: LearnModalFiltersState
  onModulesChange: (modules: Array<string>) => void
  onApplyModalFilters: (next: LearnModalFiltersState) => void
}

export function LearnControlsSection({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  moduleFilterOptions,
  categoryFilterOptions,
  typeFilterOptions,
  instructorFilterOptions,
  modalFilters,
  onModulesChange,
  onApplyModalFilters,
}: LearnControlsSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const moduleDropdownOptions: Array<MasaiDropdownCheckboxFilterOption> =
    useMemo(
      () =>
        moduleFilterOptions.map((name) => ({
          value: name,
          label: name,
        })),
      [moduleFilterOptions],
    )
  const hasModuleChoices = moduleDropdownOptions.length > 0

  return (
    <section className="py-5 flex flex-row items-start justify-between gap-4 md:items-center">
      <div
        role="tablist"
        aria-label="Learning content type"
        className="flex flex-wrap items-center gap-4"
      >
        {LEARN_TAB_ITEMS.map((tab) => (
          <MasaiTab
            key={tab.value}
            label={tab.label}
            selected={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
            iconLeft={
              <img
                src={LEARN_TAB_ICON_URL}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 object-contain"
              />
            }
          />
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <MasaiInput
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER_BY_TAB[activeTab]}
          iconLeft={<Search className="size-4 shrink-0" strokeWidth={2} />}
          className="w-[300px]"
        />

        <MasaiDropdownCheckboxFilter
          triggerLabel="Module"
          options={moduleDropdownOptions}
          value={modalFilters.modules}
          onValueChange={onModulesChange}
          disabled={!hasModuleChoices}
          className="w-[170px]"
          triggerClassName="min-w-0 w-full"
        />

        <MasaiButton
          type="tertiary"
          size="md"
          iconOnly
          icon={<Filter className="size-6" strokeWidth={2} />}
          htmlType="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Open filters"
          className="!border !border-slate-200 !text-slate-700 hover:!bg-slate-50"
        />
      </div>

      <MasaiDrawer
        isOpen={filtersOpen}
        onOpenChange={setFiltersOpen}
        direction="right"
        sideMarginInPx={16}
        title="Filters"
        content={
          <LearnFiltersPanel
            filtersOpen={filtersOpen}
            moduleOptions={moduleFilterOptions}
            categoryOptions={categoryFilterOptions}
            typeOptions={typeFilterOptions}
            instructorOptions={instructorFilterOptions}
            selectedFilters={modalFilters}
            onApply={onApplyModalFilters}
            onRequestClose={() => setFiltersOpen(false)}
          />
        }
      />
    </section>
  )
}
