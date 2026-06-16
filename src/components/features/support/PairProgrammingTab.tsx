/**
 * PairProgrammingTab — the "1:1 Support" tab.
 *
 * Lists the student's coordinators (IA / EC / PC) with a "Book a slot" action
 * (Calendly) — the data the legacy 1:1 tab surfaces. Hidden entirely by the
 * parent when no coordinators are configured; this component also shows the
 * legacy unavailable-copy as a safety net.
 */

import { CalendarCheck } from '@phosphor-icons/react'

import type { SupportCoordinator } from '@/server/api/support/support.types'

const KIND_LABEL: Record<SupportCoordinator['kind'], string> = {
  IA: 'Instructor Associate',
  EC: 'Education Coordinator',
  PC: 'Program Coordinator',
}

export function PairProgrammingTab({
  coordinators,
}: {
  coordinators: Array<SupportCoordinator>
}) {
  if (coordinators.length === 0) {
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
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="font-poppins text-[14px] font-semibold text-gray-900 mb-3">
          Book a 1:1 with your coordinators
        </h3>
        <div className="space-y-3">
          {coordinators.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] font-poppins text-[13px] font-semibold text-[#6962AC]">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-poppins text-[14px] font-medium text-[#1F2A37]">{c.name}</p>
                <p className="font-poppins text-[12px] text-gray-500">{KIND_LABEL[c.kind]}</p>
              </div>
              {c.calendlyUrl && (
                <a
                  href={c.calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 font-poppins text-[13px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  <CalendarCheck className="size-4" />
                  Book a slot
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
