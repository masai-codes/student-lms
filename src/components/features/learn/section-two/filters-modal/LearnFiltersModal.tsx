import { Button } from '@/components/ui/button'
import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/ui/modal'

interface LearnFiltersModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  filterOptions: string[]
}

export function LearnFiltersModal({
  isOpen,
  onOpenChange,
  filterOptions,
}: LearnFiltersModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalTitle>Filters</ModalTitle>
        <ModalDescription className="mt-2">
          Dummy filter options for now. We can wire real filters later.
        </ModalDescription>
        <div className="mt-4 space-y-3">
          {filterOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <input type="checkbox" className="size-4" />
              <span>{option}</span>
            </label>
          ))}
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
