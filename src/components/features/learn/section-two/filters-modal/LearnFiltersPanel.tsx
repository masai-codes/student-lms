import type { LearnModalFiltersState, LearnPriority } from '../../shared/types'

import { Button } from '@/components/ui/button'

export interface LearnFiltersPanelProps {
  categoryOptions: Array<string>
  typeOptions: Array<string>
  instructorOptions: Array<string>
  selectedFilters: LearnModalFiltersState
  onApply: (next: LearnModalFiltersState) => void
  onRequestClose: () => void
}

export function LearnFiltersPanel({
  categoryOptions,
  typeOptions,
  instructorOptions,
  selectedFilters,
  onApply,
  onRequestClose,
}: LearnFiltersPanelProps) {
  const toggleValue = (values: Array<string>, value: string): Array<string> => {
    if (values.includes(value)) return values.filter((item) => item !== value)
    return [...values, value]
  }

  const togglePriority = (
    values: Array<LearnPriority>,
    value: LearnPriority
  ): Array<LearnPriority> => {
    if (values.includes(value)) return values.filter((item) => item !== value)
    return [...values, value]
  }

  return (
    <div className="flex flex-col">
      <p className="type-b2-regular text-muted-foreground">
        Apply filters for category, type, priority, and instructor.
      </p>

      <div className="mt-4 space-y-4 pr-1">
        <FilterSection
          title="Category"
          options={categoryOptions}
          selectedValues={selectedFilters.categories}
          onToggle={(value) => {
            onApply({
              ...selectedFilters,
              categories: toggleValue(selectedFilters.categories, value),
            })
          }}
        />

        <FilterSection
          title="Type"
          options={typeOptions}
          selectedValues={selectedFilters.types}
          onToggle={(value) => {
            onApply({
              ...selectedFilters,
              types: toggleValue(selectedFilters.types, value),
            })
          }}
        />

        <FilterSection
          title="Instructor"
          options={instructorOptions}
          selectedValues={selectedFilters.instructors}
          onToggle={(value) => {
            onApply({
              ...selectedFilters,
              instructors: toggleValue(selectedFilters.instructors, value),
            })
          }}
        />

        <FilterSection
          title="Priority"
          options={['recommended', 'mandatory']}
          selectedValues={selectedFilters.priorities}
          onToggle={(value) => {
            onApply({
              ...selectedFilters,
              priorities: togglePriority(
                selectedFilters.priorities,
                value as LearnPriority
              ),
            })
          }}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onRequestClose}>
          Cancel
        </Button>
        <Button onClick={onRequestClose}>Apply</Button>
      </div>
    </div>
  )
}

function FilterSection({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string
  options: Array<string>
  selectedValues: Array<string>
  onToggle: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 rounded-md border p-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
