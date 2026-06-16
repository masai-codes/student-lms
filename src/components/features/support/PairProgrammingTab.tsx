/**
 * PairProgrammingTab — the "1:1 Support" tab.
 *
 * Lists each pp-enabled section (from `getOneOnOneSections`) with its IA / EC /
 * PC and a "Book a 1:1 session" link (the section's `ppLink`). The tab itself is
 * shown by the parent only when at least one such section exists.
 */

import { CalendarCheck } from '@phosphor-icons/react'

import type {
  OneOnOneSection,
  SupportCoordinator,
} from '@/server/api/support/support.types'

const KIND_LABEL: Record<SupportCoordinator['kind'], string> = {
  IA: 'Instructor Associate',
  EC: 'Education Coordinator',
  PC: 'Program Coordinator',
}

export function PairProgrammingTab({ sections }: { sections: Array<OneOnOneSection> }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="font-poppins text-sm text-gray-700">
          1:1 Support Sessions are currently unavailable for your sections.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.sectionId} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-poppins text-[14px] font-semibold text-gray-900">
              {section.sectionName}
            </h3>
            <a
              href={section.ppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#242C3C] px-3 py-2 font-poppins text-[13px] font-semibold text-white transition-colors hover:bg-[#1B2130]"
            >
              <CalendarCheck className="size-4" />
              Book a 1:1 session
            </a>
          </div>

          {section.coordinators.length > 0 && (
            <div className="space-y-2">
              {section.coordinators.map((c) => (
                <div key={`${section.sectionId}-${c.kind}-${c.id}`} className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] font-poppins text-[12px] font-semibold text-[#6962AC]">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-poppins text-[13px] font-medium text-[#1F2A37]">{c.name}</p>
                    <p className="font-poppins text-[11px] text-gray-500">{KIND_LABEL[c.kind]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
