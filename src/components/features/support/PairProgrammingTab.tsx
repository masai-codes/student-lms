/**
 * PairProgrammingTab — the "1:1 Support" tab.
 *
 * Faithful to the legacy layout: **batches → sections**, with a "Book a 1:1
 * session" link at **both** the batch level (`batchPpLink`) and each section
 * level (`section.ppLink`), and each section listing its IA / EC / PC. Shown by
 * the parent only when at least one qualifying section exists.
 */

import { CalendarCheck } from '@phosphor-icons/react'

import type {
  OneOnOneBatchGroup,
  OneOnOneSection,
  SupportCoordinator,
} from '@/server/api/support/support.types'

const KIND_LABEL: Record<SupportCoordinator['kind'], string> = {
  IA: 'Instructor Associate',
  EC: 'Education Coordinator',
  PC: 'Program Coordinator',
}

function BookButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#242C3C] px-3 py-2 font-poppins text-[13px] font-semibold text-white transition-colors hover:bg-[#1B2130]"
    >
      <CalendarCheck className="size-4" />
      {label}
    </a>
  )
}

function SectionRow({ section }: { section: OneOnOneSection }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-poppins text-[13px] font-semibold text-foreground">
          {section.sectionName}
        </h4>
        <BookButton href={section.ppLink} label="Book 1:1" />
      </div>
      {section.coordinators.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {section.coordinators.map((c) => (
            <div
              key={`${section.sectionId}-${c.kind}-${c.id}`}
              className="flex items-center gap-2"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] font-poppins text-[11px] font-semibold text-brand dark:bg-info-subtle dark:text-info-subtle-foreground">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-poppins text-[12px] font-medium text-foreground">
                  {c.name}
                </p>
                <p className="font-poppins text-[11px] text-foreground-muted">
                  {KIND_LABEL[c.kind]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PairProgrammingTab({
  groups,
}: {
  groups: Array<OneOnOneBatchGroup>
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="font-poppins text-sm text-foreground">
          1:1 Support Sessions are currently unavailable for your sections.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div
          key={group.batchId ?? 'unknown'}
          className="rounded-xl border border-border bg-surface-muted p-4"
        >
          {/* Batch header + batch-level 1:1 link */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-poppins text-[11px] uppercase tracking-wide text-foreground-muted">
                Batch
              </p>
              <h3 className="font-poppins text-[15px] font-semibold text-foreground">
                {group.batchName}
              </h3>
            </div>
            {group.batchPpLink && (
              <BookButton href={group.batchPpLink} label="Book 1:1 (Batch)" />
            )}
          </div>

          {/* Sections within the batch */}
          <div className="space-y-3">
            {group.sections.map((section) => (
              <SectionRow key={section.sectionId} section={section} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
