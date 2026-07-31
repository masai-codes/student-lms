import { MessagesSquare } from 'lucide-react'

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
          </div>
        </SlotPortal>
      </div>
    </section>
  )
}
