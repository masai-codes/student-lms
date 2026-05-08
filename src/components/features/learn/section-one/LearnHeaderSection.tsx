import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: string[]
  onBatchChange: (batch: string) => void
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
}: LearnHeaderSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <Select value={selectedBatch} onValueChange={onBatchChange}>
        <SelectTrigger className="w-full md:w-[300px]">
          <SelectValue placeholder="Select batch" />
        </SelectTrigger>
        <SelectContent>
          {batches.map((batch) => (
            <SelectItem key={batch} value={batch}>
              {batch}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-4 text-sm font-medium">
        <button type="button" className="text-primary hover:underline">
          Attendance Report
        </button>
        <button type="button" className="text-primary hover:underline">
          Course Details
        </button>
      </div>
    </section>
  )
}
