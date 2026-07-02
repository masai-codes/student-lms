import { ScheduleCard } from './ScheduleCard'
import type { ScheduleDay, ScheduleWeek } from '../shared/types'

interface ScheduleWeekGroupProps {
  week: ScheduleWeek
}

// Renders one week: a range label followed by each day's date badge and cards.
export function ScheduleWeekGroup({ week }: ScheduleWeekGroupProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">
        {week.label}
      </p>

      {week.days.map((day) => (
        <ScheduleDayRow key={day.id} day={day} />
      ))}
    </div>
  )
}

function ScheduleDayRow({ day }: { day: ScheduleDay }) {
  return (
    <div className="flex gap-3">
      <DayBadge day={day} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {day.items.map((item) => (
          <ScheduleCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function DayBadge({ day }: { day: ScheduleDay }) {
  if (day.isActive) {
    return (
      <div className="flex h-fit shrink-0 flex-col items-center rounded-lg bg-[#4F46E5] px-2.5 py-1.5 text-white">
        <span className="text-[10px] font-semibold uppercase leading-none">
          {day.weekday}
        </span>
        <span className="text-base font-bold leading-tight">{day.dayOfMonth}</span>
      </div>
    )
  }

  return (
    <div className="flex h-fit w-10 shrink-0 flex-col items-center text-gray-500">
      <span className="text-[10px] font-semibold uppercase leading-none">
        {day.weekday}
      </span>
      <span className="text-base font-bold leading-tight text-gray-700">
        {day.dayOfMonth}
      </span>
    </div>
  )
}
