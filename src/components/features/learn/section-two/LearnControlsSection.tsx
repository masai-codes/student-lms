'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Filter, Search } from 'lucide-react'

import { LearnFiltersPanel } from './filters-modal/LearnFiltersPanel'
import { LearnTabSwitcher } from './LearnTabSwitcher'
import { useDebouncedCommit } from './useDebouncedCommit'
import { pushLearnEvent } from '../shared/learnAnalytics'
import type {
  LearnModalFiltersState,
  LearnScheduleHorizon,
  LearnTab,
} from '../shared/types'
import { LEARN_SCHEDULE_HORIZON_OPTIONS } from '../shared/types'

import type { EnrolledSection } from '@/server/learn/types'
import type { MasaiDropdownCheckboxFilterOption } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiDropdownCheckboxFilter } from '@/components/ui/masai-dropdown-checkbox-filter'
import { MasaiSelectDropdown } from '@/components/ui/masai-select-dropdown'
import { MasaiButton } from '@/components/masai-button'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { MasaiInput } from '@/components/ui/masai-input'
import { SlotPortal } from '@/components/common/SlotPortal'
import { LEARN_TIER2_TABS_SLOT_ID } from '@/components/features/layout/learnTier2Slots'

/** Debounce before committing the search term to the URL (keeps typing smooth). */
const SEARCH_DEBOUNCE_MS = 1000

/** Shorter debounce for module checkboxes — ticks apply optimistically, fetch follows. */
const MODULE_DEBOUNCE_MS = 400

const SEARCH_PLACEHOLDER_BY_TAB: Record<LearnTab, string> = {
  lectures: 'Search lectures',
  assignments: 'Search assignments',
  resources: 'Search resources',
}

/** Sentinel option value for "Any section". */
const ANY_SECTION_VALUE = 'any'

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
  horizon: LearnScheduleHorizon
  onHorizonChange: (horizon: LearnScheduleHorizon) => void
  /** Section filter — opt-in per batch (`batches.meta.showSectionDropdown`). */
  showSectionDropdown?: boolean
  sections?: Array<EnrolledSection>
  /** `null` when "Any section" is active. */
  selectedSectionId?: number | null
  onSectionChange?: (sectionId: number | null) => void
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
  horizon,
  onHorizonChange,
  showSectionDropdown = false,
  sections = [],
  selectedSectionId = null,
  onSectionChange,
}: LearnControlsSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const sectionOptions = useMemo(
    () => [
      { value: ANY_SECTION_VALUE, label: 'All Courses' },
      ...sections.map((section) => ({
        value: section.sectionId.toString(),
        label: section.name,
      })),
    ],
    [sections],
  )
  // Show "Any" for a stale/unknown section id (LearnLayout clears it shortly after).
  const sectionValue =
    selectedSectionId != null &&
    sections.some((section) => section.sectionId === selectedSectionId)
      ? selectedSectionId.toString()
      : ANY_SECTION_VALUE

  // Fire the search event only on the committed (debounced) value, not per
  // keystroke, and only when the query is non-empty.
  const handleSearchCommit = useCallback(
    (value: string) => {
      const query = value.trim()
      if (query) {
        pushLearnEvent('l_learn_search', { query, tab: activeTab })
      }
      onSearchChange(value)
    },
    [activeTab, onSearchChange],
  )

  // Local drafts so typing and checkbox ticks reflect instantly; the actual fetch
  // (URL commit) is debounced rather than firing on every keystroke/click.
  const [searchInput, setSearchInput] = useDebouncedCommit(
    searchValue,
    handleSearchCommit,
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

  // Tabs stack above the controls on small screens; one row from `md` up.
  return (
    <section className="flex flex-col gap-2 py-0 items-start lg:flex-row lg:items-center lg:justify-between">
      {/* Lectures/Assignments/Resources: inline on mobile (no Tier 2 nav there
          yet); portaled into the desktop navbar's Tier 2 row on `lg`+, where
          the inline copy is hidden via the ancestor's `max-lg:hidden`. */}
      <LearnTabSwitcher
        activeTab={activeTab}
        onTabChange={onTabChange}
        className="lg:hidden"
      />
      <SlotPortal slotId={LEARN_TIER2_TABS_SLOT_ID}>
        <LearnTabSwitcher
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="tier2"
        />
      </SlotPortal>

      {/* Search takes the full first line below `sm` so module + filter never
          squeeze off-screen at 320px. Triggers are sized to match the Tier 2
          navbar's compact program-picker pill (h-8, rounded-full, text-sm). */}
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
        <MasaiInput
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER_BY_TAB[activeTab]}
          iconLeft={<Search className="size-4 shrink-0" strokeWidth={2} />}
          className="h-8 min-h-0 w-full min-w-0 rounded-full px-3 py-0 text-sm sm:w-65"
        />

        {showSectionDropdown ? (
          <MasaiSelectDropdown
            triggerLabel=""
            menuLabel="Select a course"
            aria-label="Filter by course"
            options={sectionOptions}
            value={sectionValue}
            disabled={sections.length === 0}
            onValueChange={(value) => {
              const nextSectionId =
                value === ANY_SECTION_VALUE ? null : Number(value)
              pushLearnEvent('l_learn_section_change', {
                section_id: nextSectionId ?? 'any',
              })
              onSectionChange?.(nextSectionId)
            }}
            className="min-w-30 flex-1 sm:w-40 sm:flex-none"
            triggerClassName="h-8 min-h-0 min-w-0 w-full gap-1.5 rounded-full px-3 py-0 text-sm"
            chevronVariant="plain"
          />
        ) : null}

        <MasaiSelectDropdown
          triggerLabel=""
          menuLabel="Select timeframe"
          aria-label="Filter by timeframe"
          options={LEARN_SCHEDULE_HORIZON_OPTIONS}
          value={horizon}
          onValueChange={(value) => {
            const nextHorizon = value as LearnScheduleHorizon
            pushLearnEvent('l_learn_horizon_change', {
              horizon: nextHorizon,
              tab: activeTab,
            })
            onHorizonChange(nextHorizon)
          }}
          className="min-w-[120px] flex-1 sm:w-[160px] sm:flex-none"
          triggerClassName="h-8 min-h-0 min-w-0 w-full gap-1.5 rounded-full px-3 py-0 text-sm"
          chevronVariant="plain"
        />

        <MasaiDropdownCheckboxFilter
          triggerLabel="Module"
          menuLabel="Select modules"
          options={moduleDropdownOptions}
          value={selectedModules}
          onValueChange={setSelectedModules}
          disabled={!hasModuleChoices}
          className="min-w-[110px] flex-1 sm:w-[140px] sm:flex-none"
          triggerClassName="h-8 min-h-0 min-w-0 w-full gap-1.5 rounded-full px-3 py-0 text-sm"
          chevronVariant="plain"
        />

        <div className="relative shrink-0">
          <MasaiButton
            type="tertiary"
            size="sm"
            icon={<Filter className="size-4" strokeWidth={2} />}
            ctaText="More filters"
            htmlType="button"
            onClick={() => {
              pushLearnEvent('l_learn_filters_open', {
                tab: activeTab,
                active_filter_count: filterCount,
              })
              setFiltersOpen(true)
            }}
            aria-label={
              filterCount > 0
                ? `Open filters, ${filterCount} active`
                : 'Open filters'
            }
            className="h-8 !rounded-full !border !border-border !text-foreground transition-all duration-200 hover:-translate-y-px hover:!border-brand/35 hover:!bg-surface-muted active:scale-95"
          />
          {filterCount > 0 ? (
            <span
              className="animate-dash-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-danger-foreground"
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
