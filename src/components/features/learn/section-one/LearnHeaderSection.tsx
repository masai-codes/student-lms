import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { Check, ChevronDown, ExternalLink } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pushLearnEvent } from '../shared/learnAnalytics'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

interface LearnBatchOption {
  value: string
  label: string
  courseLogo: string | null
  showBatchDetails: boolean
}

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: Array<LearnBatchOption>
  onBatchChange: (batch: string) => void
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
}: LearnHeaderSectionProps) {
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false)

  const selectedBatchOption = useMemo(
    () => batches.find((batch) => batch.value === selectedBatch),
    [batches, selectedBatch],
  )
  const selectedBatchLabel = selectedBatchOption?.label ?? 'Select batch'

  // Course details still lives in the legacy student app (resolve URL per origin),
  // and is only surfaced when the batch opts in via `showBatchDetails` (legacy LMS).
  const courseDetailsHref = selectedBatchOption?.showBatchDetails
    ? getOldStudentUiUrlForPath(`/new-courses/${selectedBatch}`)
    : undefined

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Batch picker anchors to the title chip (same anchored menu on every viewport). */}
      <DropdownMenu open={isBatchMenuOpen} onOpenChange={setIsBatchMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open batch selection"
            className="group flex min-w-0 cursor-pointer items-center gap-3 rounded-lg text-left transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <h4 className="type-h4 min-w-0 break-words">
              {selectedBatchLabel}
            </h4>
            <span
              className="flex shrink-0 items-center justify-center rounded-full bg-blue-50 p-2 text-blue-500 transition-colors group-hover:bg-blue-100"
              aria-hidden
            >
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${
                  isBatchMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="max-h-[min(60vh,420px)] w-[min(92vw,360px)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          <DropdownMenuLabel className="text-slate-900">
            Select a course
          </DropdownMenuLabel>
          {batches.map((batch, index) => {
            const isSelected = batch.value === selectedBatch
            return (
              <DropdownMenuItem
                key={batch.value}
                onSelect={() => {
                  pushLearnEvent('l_learn_batch_change_id_' + batch.value, {
                    batch_id: batch.value,
                    batch_label: batch.label,
                  })
                  onBatchChange(batch.value)
                }}
                style={{ '--dash-delay': `${index * 0.04}s` } as CSSProperties}
                className={`animate-dash-row-in cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#4F6BED]/5 focus:bg-[#4F6BED]/5 ${
                  isSelected ? 'bg-[#4F6BED]/5' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {batch.courseLogo ? (
                    <img
                      src={batch.courseLogo}
                      alt=""
                      className="h-10 w-auto max-w-[140px] object-contain object-left"
                    />
                  ) : null}
                  <span
                    className={`type-b1-md break-words font-semibold ${
                      isSelected ? 'text-[#4F6BED]' : 'text-slate-900'
                    }`}
                  >
                    {batch.label}
                  </span>
                </div>
                {isSelected ? (
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-[#4F6BED]"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {courseDetailsHref ? (
        <a
          href={courseDetailsHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            pushLearnEvent('l_learn_course_details_click_id_' + selectedBatch, {
              batch_id: selectedBatch,
            })
          }
          className="type-b1-md group flex shrink-0 items-center gap-1 self-start text-primary-500 transition-colors hover:text-primary-600 hover:underline md:self-auto"
        >
          <span>Course Details</span>
          <ExternalLink
            className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      ) : null}
    </section>
  )
}
