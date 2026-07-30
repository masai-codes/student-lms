import { useEffect, useState } from 'react'
import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiDateRangePicker } from '@/components/ui/masai-date-range-picker'
import {
  FilterCheckboxColumn,
  type FilterColumnOption,
} from '@/components/features/shared/FilterCheckboxColumn'
import {
  ANNOUNCEMENT_FILTER_SECTIONS,
  ANNOUNCEMENT_TYPE_OPTIONS,
  SECTION_LABELS,
  createEmptyAnnouncementFilters,
} from './announcementFilterConfig'
import type {
  AnnouncementFilters,
  AnnouncementFilterSection,
} from './announcementFilterConfig'

export interface AnnouncementFiltersPanelProps {
  filtersOpen: boolean
  categoryOptions: Array<FilterColumnOption>
  announcerOptions: Array<FilterColumnOption>
  selectedFilters: AnnouncementFilters
  onApply: (next: AnnouncementFilters) => void
}

const SECTION_FIELD: Record<
  Exclude<AnnouncementFilterSection, 'date'>,
  keyof AnnouncementFilters
> = {
  type: 'types',
  category: 'categories',
  announcedBy: 'announcedBy',
}

export function AnnouncementFiltersPanel({
  filtersOpen,
  categoryOptions,
  announcerOptions,
  selectedFilters,
  onApply,
}: AnnouncementFiltersPanelProps) {
  const [draft, setDraft] = useState<AnnouncementFilters>(selectedFilters)
  const [activeNav, setActiveNav] = useState<AnnouncementFilterSection>('type')

  // Re-sync the draft from committed filters each time the drawer opens.
  useEffect(() => {
    if (filtersOpen) {
      setDraft(structuredClone(selectedFilters))
      setActiveNav('type')
    }
  }, [filtersOpen])

  function optionsFor(
    section: Exclude<AnnouncementFilterSection, 'date'>,
  ): Array<FilterColumnOption> {
    if (section === 'type') return ANNOUNCEMENT_TYPE_OPTIONS
    if (section === 'category') return categoryOptions
    return announcerOptions
  }

  function toggle(field: keyof AnnouncementFilters, value: string) {
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
        <nav className="w-[120px] shrink-0 border-r border-border sm:w-[160px]">
          {ANNOUNCEMENT_FILTER_SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              data-testid={`announcements-filter-nav-${section}`}
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
            <FilterCheckboxColumn
              key={activeNav}
              options={optionsFor(activeNav)}
              selected={draft[SECTION_FIELD[activeNav]] as Array<string>}
              onToggle={(value) => toggle(SECTION_FIELD[activeNav], value)}
            />
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-4">
        <MasaiButton
          type="tertiary"
          size="sm"
          htmlType="button"
          ctaText="Clear all"
          data-testid="announcements-filter-clear"
          onClick={() => {
            const cleared = createEmptyAnnouncementFilters()
            setDraft(cleared)
            onApply(cleared)
          }}
        />
        <MasaiButton
          type="primary"
          size="sm"
          htmlType="button"
          ctaText="Apply"
          data-testid="announcements-filter-apply"
          onClick={() => onApply(draft)}
        />
      </div>
    </div>
  )
}
