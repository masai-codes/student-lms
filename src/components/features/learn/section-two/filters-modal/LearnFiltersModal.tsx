import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/ui/modal'
import type { LearnModalFiltersState, LearnPriority } from '../../shared/types'

interface LearnFiltersModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  categoryOptions: Array<string>
  typeOptions: Array<string>
  instructorOptions: Array<string>
  selectedFilters: LearnModalFiltersState
  onApply: (next: LearnModalFiltersState) => void
}

export function LearnFiltersModal({
  isOpen,
  onOpenChange,
  categoryOptions,
  typeOptions,
  instructorOptions,
  selectedFilters,
  onApply,
}: LearnFiltersModalProps) {
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
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalTitle>Filters</ModalTitle>
        <ModalDescription className="mt-2">
          Apply filters for category, type, priority, and instructor.
        </ModalDescription>

        <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
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
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Apply</Button>
        </div>
      </ModalContent>
    </Modal>
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
