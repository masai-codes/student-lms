import { X } from 'lucide-react'

import type { CSSProperties } from 'react'
import type { LearnModalFiltersState } from '../shared/types'

import { pushLearnEvent } from '../shared/learnAnalytics'
import { MasaiChips } from '@/components/ui/masai-chips'
import { buildAppliedLearnFilterChips } from '@/lib/learn/learnPageSearch'

interface LearnAppliedFiltersProps {
  filters: LearnModalFiltersState
  /** Commit the filter state with one chip removed. */
  onChange: (next: LearnModalFiltersState) => void
  onClearAll: () => void
}

export function LearnAppliedFilters({
  filters,
  onChange,
  onClearAll,
}: LearnAppliedFiltersProps) {
  const chips = buildAppliedLearnFilterChips(filters)

  if (chips.length === 0) {
    return null
  }

  return (
    <section
      className="animate-dash-rise mt-[16px] flex flex-wrap items-center gap-2 [--dash-delay:0.08s]"
      aria-label="Applied filters"
    >
      {chips.map((chip, index) => (
        <span
          key={chip.id}
          className="animate-dash-row-in inline-flex"
          style={{ '--dash-delay': `${index * 0.05}s` } as CSSProperties}
        >
          <MasaiChips
            type="right-icon"
            size="regular"
            label={chip.label}
            icon={<X className="size-3.5" aria-hidden />}
            onClick={() => {
              pushLearnEvent('l_learn_filter_remove', { filter: chip.id })
              onChange(chip.next)
            }}
            aria-label={`Remove filter: ${chip.label}`}
            backgroundClassName="bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-[#4F6BED]/35"
            textClassName="!text-gray-700"
          />
        </span>
      ))}

      <button
        type="button"
        onClick={() => {
          pushLearnEvent('l_learn_filters_clear_all')
          onClearAll()
        }}
        className="type-b3-md px-1 text-primary-500 transition-all duration-200 hover:translate-x-0.5 hover:text-primary-600 hover:underline"
      >
        Clear all
      </button>
    </section>
  )
}
