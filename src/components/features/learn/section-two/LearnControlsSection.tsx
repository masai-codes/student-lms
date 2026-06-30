'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Filter, Search } from 'lucide-react'

import { LearnFiltersPanel } from './filters-modal/LearnFiltersPanel'
import { useDebouncedCommit } from './useDebouncedCommit'
import type { LearnModalFiltersState, LearnTab } from '../shared/types'

import type { MasaiDropdownCheckboxFilterOption } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiDropdownCheckboxFilter } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiButton } from '@/components/masai-button'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { MasaiInput } from '@/components/ui/masai-input'
import { MasaiTab } from '@/components/ui/masai-tab'

/** Debounce before committing the search term to the URL (keeps typing smooth). */
const SEARCH_DEBOUNCE_MS = 1000

/** Shorter debounce for module checkboxes — ticks apply optimistically, fetch follows. */
const MODULE_DEBOUNCE_MS = 400

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
  filterCount: number
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
  filterCount,
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

  // Local drafts so typing and checkbox ticks reflect instantly; the actual fetch
  // (URL commit) is debounced rather than firing on every keystroke/click.
  const [searchInput, setSearchInput] = useDebouncedCommit(
    searchValue,
    onSearchChange,
    SEARCH_DEBOUNCE_MS,
  )
  const [selectedModules, setSelectedModules] = useDebouncedCommit(
    modalFilters.modules,
    onModulesChange,
    MODULE_DEBOUNCE_MS,
  )

  // Modal "Apply" stages the filters and closes the drawer; the actual commit
  // (which navigates + refetches) runs only once the close animation finishes, so
  // the refetch re-render can't interrupt the closing drawer (no flash).
  const pendingApplyRef = useRef<LearnModalFiltersState | null>(null)
  const applyFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushPendingApply = useCallback(() => {
    if (applyFallbackRef.current) {
      clearTimeout(applyFallbackRef.current)
      applyFallbackRef.current = null
    }
    const pending = pendingApplyRef.current
    if (pending) {
      pendingApplyRef.current = null
      onApplyModalFilters(pending)
    }
  }, [onApplyModalFilters])

  const handleApplyFilters = useCallback(
    (next: LearnModalFiltersState) => {
      pendingApplyRef.current = next
      setFiltersOpen(false)
      // Safety net in case the drawer's close animation never reports completion.
      if (applyFallbackRef.current) clearTimeout(applyFallbackRef.current)
      applyFallbackRef.current = setTimeout(flushPendingApply, 600)
    },
    [flushPendingApply],
  )

  useEffect(() => {
    return () => {
      if (applyFallbackRef.current) clearTimeout(applyFallbackRef.current)
    }
  }, [])

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
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER_BY_TAB[activeTab]}
          iconLeft={<Search className="size-4 shrink-0" strokeWidth={2} />}
          className="w-[300px]"
        />

        <MasaiDropdownCheckboxFilter
          triggerLabel="Module"
          options={moduleDropdownOptions}
          value={selectedModules}
          onValueChange={setSelectedModules}
          disabled={!hasModuleChoices}
          className="w-[170px]"
          triggerClassName="min-w-0 w-full"
        />

        <div className="relative shrink-0">
          <MasaiButton
            type="tertiary"
            size="md"
            iconOnly
            icon={<Filter className="size-6" strokeWidth={2} />}
            htmlType="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={
              filterCount > 0
                ? `Open filters, ${filterCount} active`
                : 'Open filters'
            }
            className="!border !border-slate-200 !text-slate-700 hover:!bg-slate-50"
          />
          {filterCount > 0 ? (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white"
              aria-hidden
            >
              {filterCount > 99 ? '99+' : filterCount}
            </span>
          ) : null}
        </div>
      </div>

      <MasaiDrawer
        isOpen={filtersOpen}
        onOpenChange={setFiltersOpen}
        onClosed={flushPendingApply}
        direction="right"
        sideMarginInPx={16}
        title="Filters"
        content={
          <LearnFiltersPanel
            activeTab={activeTab}
            filtersOpen={filtersOpen}
            moduleOptions={moduleFilterOptions}
            categoryOptions={categoryFilterOptions}
            typeOptions={typeFilterOptions}
            instructorOptions={instructorFilterOptions}
            selectedFilters={modalFilters}
            onApply={handleApplyFilters}
          />
        }
      />
    </section>
  )
}
