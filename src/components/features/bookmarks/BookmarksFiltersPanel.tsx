import { useEffect, useState } from 'react'
import { MasaiButton } from '@/components/masai-button'
import { MasaiDateRangePicker } from '@/components/ui/masai-date-range-picker'
import { BookmarkCheckboxColumn } from './BookmarkCheckboxColumn'
import {
  createEmptyBookmarkFilters,
  getBookmarkFilterSections,
  getTypeOptions,
  SECTION_LABELS,
} from './bookmarksFilterConfig'
import type {
  BookmarkFilters,
  BookmarkFilterSection,
  FilterOption,
} from './bookmarksFilterConfig'
import type { BookmarkTab } from './bookmarksConfig'
import type { BookmarkFilterOptionsResult } from '@/lib/api/bookmarks/bookmarksApi'

export interface BookmarksFiltersPanelProps {
  tab: BookmarkTab
  /** Re-syncs the draft from committed filters each time the drawer opens. */
  filtersOpen: boolean
  options: BookmarkFilterOptionsResult
  selectedFilters: BookmarkFilters
  onApply: (next: BookmarkFilters) => void
}

const toOptions = (values: Array<string>): Array<FilterOption> =>
  values.map((value) => ({ value, label: value }))

/** Which array field on BookmarkFilters a checkbox section edits. */
const SECTION_FIELD: Partial<
  Record<BookmarkFilterSection, keyof BookmarkFilters>
> = {
  category: 'categories',
  module: 'modules',
  type: 'types',
  status: 'statuses',
  priority: 'priorities',
}

export function BookmarksFiltersPanel({
  tab,
  filtersOpen,
  options,
  selectedFilters,
  onApply,
}: BookmarksFiltersPanelProps) {
  const sections = getBookmarkFilterSections(tab)
  const [draft, setDraft] = useState<BookmarkFilters>(selectedFilters)
  const [activeNav, setActiveNav] = useState<BookmarkFilterSection>(sections[0])

  // Re-sync the draft from committed filters each time the drawer opens, so
  // edits are discarded on close-without-apply. Keyed on the open transition
  // only — depending on `selectedFilters` (a fresh object each parent render)
  // would wipe in-progress edits whenever the page re-renders while open.
  useEffect(() => {
    if (filtersOpen) {
      setDraft(structuredClone(selectedFilters))
      setActiveNav(sections[0])
    }
  }, [filtersOpen])

  function optionsFor(section: BookmarkFilterSection): Array<FilterOption> {
    if (section === 'category') return toOptions(options.categories)
    if (section === 'module') return toOptions(options.modules)
    if (section === 'status') return toOptions(options.statuses)
    if (section === 'priority') return toOptions(options.priorities)
    if (section === 'type') return getTypeOptions(tab)
    return []
  }

  function toggle(field: keyof BookmarkFilters, value: string) {
    setDraft((prev) => {
      const current = prev[field] as Array<string>
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [field]: next }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="w-[104px] shrink-0 border-r border-border sm:w-[148px]">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              data-testid={`bookmarks-filter-nav-${section}`}
              onClick={() => setActiveNav(section)}
              className={`block w-full px-3 py-3 text-left type-b2-md transition-colors ${
                activeNav === section
                  ? 'bg-brand-subtle text-brand'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              {SECTION_LABELS[section]}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {activeNav === 'date' ? (
            <MasaiDateRangePicker
              startDate={draft.startDate ?? null}
              endDate={draft.endDate ?? null}
              onChange={(range) =>
                setDraft((prev) => ({
                  ...prev,
                  startDate: range.start ?? undefined,
                  endDate: range.end ?? undefined,
                }))
              }
            />
          ) : (
            <BookmarkCheckboxColumn
              key={activeNav}
              options={optionsFor(activeNav)}
              selected={(draft[SECTION_FIELD[activeNav]!] as Array<string>) ?? []}
              onToggle={(value) => toggle(SECTION_FIELD[activeNav]!, value)}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-4">
        <MasaiButton
          type="tertiary"
          size="sm"
          htmlType="button"
          ctaText="Clear all"
          data-testid="bookmarks-filter-clear"
          onClick={() => {
            const cleared = createEmptyBookmarkFilters()
            setDraft(cleared)
            onApply(cleared)
          }}
        />
        <MasaiButton
          type="primary"
          size="sm"
          htmlType="button"
          ctaText="Apply"
          data-testid="bookmarks-filter-apply"
          onClick={() => onApply(draft)}
        />
      </div>
    </div>
  )
}
