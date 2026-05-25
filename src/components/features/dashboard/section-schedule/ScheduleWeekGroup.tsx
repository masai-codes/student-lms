import { getTodayDateKey } from '../shared/scheduleUtils'
import { ScheduleCard } from './schedule-card/ScheduleCard'
import type { ScheduleDateGroup, ScheduleWeekGroup } from '../shared/types'

function EmptyDayRow({
  dateGroup,
  isToday,
}: {
  dateGroup: ScheduleDateGroup
  isToday: boolean
}) {
  const [dow, date] = dateGroup.dayLabel.split(' ')
  return (
    <div className="flex items-stretch gap-3">
      <div className="w-[52px] shrink-0 flex flex-col items-center pt-3">
        <div
          className={`flex flex-col items-center justify-center rounded-[8px] px-1 py-1.5 min-w-[44px] ${
            isToday ? 'bg-[#3F83F8]' : ''
          }`}
        >
          <span className={`type-t2 font-semibold leading-none ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>{dow}</span>
          <span className={`type-b1-md font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>{date}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 bg-white rounded-[8px] border border-dashed border-gray-200 p-3 flex items-center">
        <p className="type-t1 text-gray-400">No sessions scheduled for the day</p>
      </div>
    </div>
  )
}

interface ScheduleWeekGroupProps {
  group: ScheduleWeekGroup
}

export function ScheduleWeekGroupSection({ group }: ScheduleWeekGroupProps) {
  const todayKey = getTodayDateKey()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="type-t1 text-[#1F2A37] font-semibold px-1 shrink-0">{group.weekLabel}</p>
        <hr className="flex-1 border-t border-gray-200" />
      </div>

      <div className="flex flex-col gap-2">
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
