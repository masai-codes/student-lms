import { useMemo } from 'react'

import { ExternalLink } from 'lucide-react'

import type { EnrolledSection } from '@/server/learn/types'
import { MasaiSelectDropdown } from '@/components/ui/masai-select-dropdown'
import { pushLearnEvent } from '../shared/learnAnalytics'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { SlotPortal } from '@/components/common/SlotPortal'
import { LEARN_TIER2_PROGRAM_SLOT_ID } from '@/components/features/layout/learnTier2Slots'
import type { LearnBatchOption } from './LearnBatchSwitcher'
import { LearnBatchSwitcher } from './LearnBatchSwitcher'

/** Sentinel option value for "Any section". */
const ANY_SECTION_VALUE = 'any'

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: Array<LearnBatchOption>
  onBatchChange: (batch: string) => void
  sections: Array<EnrolledSection>
  /** `null` when "Any section" is active. */
  selectedSectionId: number | null
  onSectionChange: (sectionId: number | null) => void
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
  sections,
  selectedSectionId,
  onSectionChange,
}: LearnHeaderSectionProps) {
  const selectedBatchOption = useMemo(
    () => batches.find((batch) => batch.value === selectedBatch),
    [batches, selectedBatch],
  )
  const sectionOptions = useMemo(
    () => [
      { value: ANY_SECTION_VALUE, label: 'Any' },
      ...sections.map((section) => ({
        value: section.sectionId.toString(),
        label: section.name,
      })),
    ],
    [sections],
  )
  // Show "Any" for a stale/unknown section id (LearnLayout clears it shortly after).
  const sectionValue =
    selectedSectionId != null &&
    sections.some((section) => section.sectionId === selectedSectionId)
      ? selectedSectionId.toString()
      : ANY_SECTION_VALUE

  // The section filter is opt-in per batch (`batches.meta.showSectionDropdown`).
  const showSectionDropdown = selectedBatchOption?.showSectionDropdown === true

  // Course details still lives in the legacy student app (resolve URL per origin),
  // and is only surfaced when the batch opts in via `showBatchDetails` (legacy LMS).
  const courseDetailsHref = selectedBatchOption?.showBatchDetails
    ? getOldStudentUiUrlForPath(`/new-courses/${selectedBatch}`)
    : undefined

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Program picker: page-header title style, inline only on mobile (no
            Tier 2 nav there yet) — desktop gets the compact navbar version
            below, portaled into the navbar's Tier 2 row, and only when there's
            more than one program to choose from. */}
        <div className="lg:hidden">
          <LearnBatchSwitcher
            selectedBatch={selectedBatch}
            batches={batches}
            onBatchChange={onBatchChange}
          />
        </div>
        {batches.length > 1 ? (
          <SlotPortal slotId={LEARN_TIER2_PROGRAM_SLOT_ID}>
            <LearnBatchSwitcher
              selectedBatch={selectedBatch}
              batches={batches}
              onBatchChange={onBatchChange}
              compact
            />
          </SlotPortal>
        ) : null}

        {/* Section filter — scopes the listing to one enrolled section of the batch.
            Only rendered for batches that opt in via `meta.showSectionDropdown`. */}
        {showSectionDropdown ? (
          <MasaiSelectDropdown
            triggerLabel="Course"
            menuLabel="Select a course"
            aria-label="Filter by course"
            options={sectionOptions}
            value={sectionValue}
            disabled={sections.length === 0}
            onValueChange={(value) => {
              const nextSectionId =
                value === ANY_SECTION_VALUE ? null : Number(value)
              pushLearnEvent('l_learn_section_change', {
                section_id: nextSectionId ?? 'any',
                batch_id: selectedBatch,
              })
              onSectionChange(nextSectionId)
            }}
            className="w-full md:w-auto"
            triggerClassName="w-full sm:w-[220px] md:w-[200px]"
          />
        ) : null}
      </div>

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
          <span>Program Details</span>
          <ExternalLink
            className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      ) : null}
    </section>
  )
}
