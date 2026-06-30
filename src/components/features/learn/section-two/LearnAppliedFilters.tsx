import { X } from 'lucide-react'

import type { LearnModalFiltersState } from '../shared/types'

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
      className="mt-[16px] flex flex-wrap items-center gap-2"
      aria-label="Applied filters"
    >
      {chips.map((chip) => (
        <MasaiChips
          key={chip.id}
          type="right-icon"
          size="regular"
          label={chip.label}
          icon={<X className="size-3.5" aria-hidden />}
          onClick={() => onChange(chip.next)}
          aria-label={`Remove filter: ${chip.label}`}
          backgroundClassName="bg-gray-50 border border-gray-200 hover:bg-gray-100"
          textClassName="!text-gray-700"
        />
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="type-b3-md px-1 text-primary-500 hover:underline"
      >
        Clear all
      </button>
    </section>
  )
}
