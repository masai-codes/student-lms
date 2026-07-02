import { getScheduleTypeVisual } from '../shared/scheduleUtils'
import type { ScheduleItem } from '../shared/types'

interface ScheduleCardProps {
  item: ScheduleItem
}

// A single schedule entry: leading type icon, title, and a meta row of
// time / course / category chips.
export function ScheduleCard({ item }: ScheduleCardProps) {
  const { Icon, colorClass } = getScheduleTypeVisual(item.type)

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <Icon size={20} weight="regular" className={`mt-0.5 shrink-0 ${colorClass}`} />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-gray-900 md:text-base">
          {item.title}
        </h4>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-600 md:text-sm">
          <span>{item.timeLabel}</span>
          <span className="size-1 rounded-full bg-gray-300" aria-hidden="true" />
          <span>{item.courseCode}</span>
          <MetaChip label={item.category} />
          <MetaChip label={item.module} />
        </div>
      </div>
    </div>
  )
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {label}
    </span>
  )
}
