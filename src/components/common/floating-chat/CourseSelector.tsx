import { cn } from '@/lib/utils'
import { CaretRight } from '@phosphor-icons/react'
import type { SupportBatch } from '@/server/api/support/support.types'

interface CourseSelectorProps {
  batches: SupportBatch[]
  selectedBatchId: number | null
  onSelect: (batchId: number) => void
}

export function CourseSelector({
  batches,
  selectedBatchId,
  onSelect,
}: CourseSelectorProps) {
  return (
    <>
      {batches.map((batch) => {
        const isSelected = selectedBatchId === batch.id
        return (
          <div
            key={batch.id}
            onClick={() => onSelect(batch.id)}
            className={cn(
              'group relative flex items-center shrink-0 gap-[13px] p-[14px_14px_14px_16px] border-[1.5px] rounded-[14px] bg-surface cursor-pointer transition-all duration-150 ease-out',
              isSelected
                ? 'border-[#4b4396] dark:border-brand shadow-[0_0_0_3px_rgba(75,67,150,0.15)] dark:shadow-[0_0_0_3px_rgba(169,163,236,0.2)] bg-[rgba(75,67,150,0.06)] dark:bg-brand/15'
                : 'border-[#e9e9f3] dark:border-border hover:border-[#4b4396]/30 dark:hover:border-brand/40 hover:bg-[rgba(75,67,150,0.03)] dark:hover:bg-brand/10 hover:translate-x-0.5 hover:shadow-[0_1px_2px_rgba(20,20,43,0.05)]',
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10.8px] font-bold text-[#9496ab] dark:text-foreground-subtle uppercase tracking-wider mb-0.5">
                Batch
              </div>
              <div className="text-[14px] font-extrabold text-[#15162c] dark:text-foreground leading-tight truncate">
                {batch.name || `Batch ${batch.id}`}
              </div>
            </div>
            <div
              className={cn(
                'shrink-0 transition-colors duration-150',
                isSelected
                  ? 'text-[#4b4396] dark:text-brand'
                  : 'text-[#9496ab] dark:text-foreground-subtle group-hover:text-[#4b4396] dark:group-hover:text-brand',
              )}
            >
              <CaretRight weight="bold" className="size-4" />
            </div>
          </div>
        )
      })}
    </>
  )
}
