import { Filter, Search } from 'lucide-react'

import type { LearnTab } from '../shared/types'

import type { MasaiDropdownCheckboxFilterOption } from '@/components/ui/masai-dropdown-checkbox-filter'
import { Button } from '@/components/ui/button'
import { MasaiDropdownCheckboxFilter } from '@/components/ui/masai-dropdown-checkbox-filter'
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
  selectedModules: Array<string>
  moduleOptions: Array<MasaiDropdownCheckboxFilterOption>
  onModulesChange: (modules: Array<string>) => void
  onOpenFilters: () => void
}

export function LearnControlsSection({
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  selectedModules,
  moduleOptions,
  onModulesChange,
  onOpenFilters,
}: LearnControlsSectionProps) {
  const hasModuleChoices = moduleOptions.length > 0

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
          options={moduleOptions}
          value={selectedModules}
          onValueChange={onModulesChange}
          disabled={!hasModuleChoices}
          className="w-[170px]"
          triggerClassName="min-w-0 w-full"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          aria-label="Open filters"
        >
          <Filter className="size-4" />
        </Button>
      </div>
    </section>
  )
}
