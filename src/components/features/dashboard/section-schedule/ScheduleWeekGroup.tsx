import { getTodayDateKey } from '../shared/scheduleUtils'
import { ScheduleCard } from './schedule-card/ScheduleCard'
import type { ScheduleDateGroup, ScheduleWeekGroup } from '../shared/types'
import { useServerTime } from '@/hooks/useServerTime'

function EmptyDayRow({
  dateGroup,
  isToday,
}: {
  dateGroup: ScheduleDateGroup
  isToday: boolean
}) {
  const [dow, date] = dateGroup.dayLabel.split(' ')
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 shrink-0 flex flex-col items-center">
        <div className={`flex flex-col items-center justify-center rounded-[6px] p-1 w-8 h-8 ${isToday ? 'bg-[#3F83F8]' : ''}`}>
          <span className={`text-xs font-medium leading-none ${isToday ? 'text-white' : 'text-[#374151]'}`}>{dow}</span>
          <span className={`text-xs font-semibold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>{date}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-dashed border-gray-200 px-2 py-2.5 flex items-center">
        <p className="text-xs text-gray-400">No sessions scheduled for the day</p>
      </div>
    </div>
  )
}

interface ScheduleWeekGroupProps {
  group: ScheduleWeekGroup
}

export function ScheduleWeekGroupSection({ group }: ScheduleWeekGroupProps) {
  const { now } = useServerTime()
  const todayKey = getTodayDateKey(now)

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-[5px]">
        <p className="text-xs font-semibold uppercase text-[#1F2A37] shrink-0">{group.weekLabel}</p>
        <hr className="flex-1 border-t border-gray-200" />
      </div>

      <div className="flex flex-col gap-[10px]">
        {group.dateGroups.map((dateGroup) => {
          const isToday = dateGroup.dateKey === todayKey
          return dateGroup.items.length === 0 ? (
            <EmptyDayRow key={dateGroup.dateKey} dateGroup={dateGroup} isToday={isToday} />
          ) : (
            dateGroup.items.map((item, idx) => (
              <ScheduleCard
                key={`${item.learningType}-${item.id}`}
                item={item}
                dayLabel={idx === 0 ? dateGroup.dayLabel : null}
                isToday={isToday}
              />
            ))
          )
        })}
      </div>
    </div>
  )
}
