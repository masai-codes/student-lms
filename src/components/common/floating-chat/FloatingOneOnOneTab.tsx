import { CalendarCheck } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[#4b4396] px-3 py-2 text-[12.5px] font-bold text-white transition-all hover:bg-[#3d3680] active:scale-[0.98]"
    >
      <CalendarCheck weight="bold" className="size-3.5" />
      {label}
    </a>
  )
}

function CoordinatorChip({ coordinator }: { coordinator: SupportCoordinator }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[10px] border border-[#e9e9f3] bg-white px-2.5 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0f0fd] text-[10.5px] font-extrabold text-[#4b4396]">
        {coordinator.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[#15162c]">{coordinator.name}</p>
        <p className="text-[10.5px] font-medium text-[#9496ab]">{KIND_LABEL[coordinator.kind]}</p>
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: OneOnOneSection }) {
  return (
    <div className="rounded-[14px] border border-[#e9e9f3] bg-white p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <h4 className="text-[13.5px] font-bold text-[#15162c] leading-snug pt-0.5">
          {section.sectionName}
        </h4>
        <BookButton href={section.ppLink} label="Book 1:1" />
      </div>
      {section.coordinators.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {section.coordinators.map((c) => (
            <CoordinatorChip key={`${section.sectionId}-${c.kind}-${c.id}`} coordinator={c} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FloatingOneOnOneTab({ groups }: { groups: Array<OneOnOneBatchGroup> }) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 px-4 text-center">
        <p className="text-[14px] font-bold text-[#15162c]">1:1 sessions unavailable</p>
        <p className="text-[12.5px] text-[#62647d] leading-relaxed max-w-[280px]">
          1:1 Support Sessions are currently unavailable for your sections.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
      {groups.map((group) => (
        <div
          key={group.batchId ?? 'unknown'}
          className={cn(
            'rounded-[16px] border border-[#e9e9f3] bg-[#f8f8fc] p-3.5',
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#9496ab] mb-0.5">
                Batch
              </p>
              <h3 className="text-[15px] font-extrabold text-[#15162c] truncate">
                {group.batchName}
              </h3>
            </div>
            {group.batchPpLink ? (
              <BookButton href={group.batchPpLink} label="Book 1:1 (Batch)" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5">
            {group.sections.map((section) => (
              <SectionCard key={section.sectionId} section={section} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
