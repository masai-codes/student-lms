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
              'group relative flex items-center shrink-0 gap-[13px] p-[14px_14px_14px_16px] border-[1.5px] rounded-[14px] bg-white cursor-pointer transition-all duration-150 ease-out',
              isSelected
                ? 'border-[#4b4396] shadow-[0_0_0_3px_rgba(75,67,150,0.15)] bg-[rgba(75,67,150,0.06)]'
                : 'border-[#e9e9f3] hover:border-[#4b4396]/30 hover:bg-[rgba(75,67,150,0.03)] hover:translate-x-0.5 hover:shadow-[0_1px_2px_rgba(20,20,43,0.05)]',
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10.8px] font-bold text-[#9496ab] uppercase tracking-wider mb-0.5">
                Batch
              </div>
              <div className="text-[14px] font-extrabold text-[#15162c] leading-tight truncate">
                {batch.name || `Batch ${batch.id}`}
              </div>
            </div>
            <div
              className={cn(
                'shrink-0 transition-colors duration-150',
                isSelected
                  ? 'text-[#4b4396]'
                  : 'text-[#9496ab] group-hover:text-[#4b4396]',
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
