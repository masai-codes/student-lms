import { useMemo } from 'react'

import { ExternalLink, MessagesSquare } from 'lucide-react'

import { pushLearnEvent } from '../shared/learnAnalytics'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { SlotPortal } from '@/components/common/SlotPortal'
import { LEARN_TIER2_PROGRAM_SLOT_ID } from '@/components/features/layout/learnTier2Slots'
import type { LearnBatchOption } from './LearnBatchSwitcher'
import { LearnBatchSwitcher } from './LearnBatchSwitcher'

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
  const selectedBatchOption = useMemo(
    () => batches.find((batch) => batch.value === selectedBatch),
    [batches, selectedBatch],
  )

  // Course details still lives in the legacy student app (resolve URL per origin),
  // and is only surfaced when the batch opts in via `showBatchDetails` (legacy LMS).
  const courseDetailsHref = selectedBatchOption?.showBatchDetails
    ? getOldStudentUiUrlForPath(`/new-courses/${selectedBatch}`)
    : undefined

  const renderProgramDetailsLink = (className?: string) =>
    courseDetailsHref ? (
      <a
        href={courseDetailsHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          pushLearnEvent('l_learn_course_details_click_id_' + selectedBatch, {
            batch_id: selectedBatch,
          })
        }
        className={`type-b1-md group flex shrink-0 items-center gap-1 self-start text-primary-500 transition-colors hover:text-primary-600 hover:underline md:self-auto${className ? ` ${className}` : ''}`}
      >
        <span>Program Details</span>
        <ExternalLink
          className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </a>
    ) : null

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Program picker: compact pill/dropdown style, inline only on mobile
            (no Tier 2 nav there yet) — desktop gets the same compact navbar
            version below, portaled into the navbar's Tier 2 row. Always
            rendered, even for a single enrolled program. A Discussions link
            sits alongside it on mobile since there's no Tier 2 row to host
            it there (desktop's Discussions lives in the navbar's Tier 2). */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <LearnBatchSwitcher
            selectedBatch={selectedBatch}
            batches={batches}
            onBatchChange={onBatchChange}
            compact
          />
          <a
            href="/learn/discussions"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-brand"
          >
            <MessagesSquare className="size-4" aria-hidden />
            <span>Discussions</span>
          </a>
        </div>

        <SlotPortal slotId={LEARN_TIER2_PROGRAM_SLOT_ID}>
          <div className="flex items-center gap-3">
            <LearnBatchSwitcher
              selectedBatch={selectedBatch}
              batches={batches}
              onBatchChange={onBatchChange}
              compact
            />
            {renderProgramDetailsLink()}
          </div>
        </SlotPortal>
      </div>

      {/* On desktop (lg+) with more than one program, this same link is
          portaled into the navbar's Tier 2 program slot next to the
          switcher, so this copy only needs to cover mobile there. */}
      {renderProgramDetailsLink(undefined)}
    </section>
  )
}
