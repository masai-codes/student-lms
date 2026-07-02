import { useState } from 'react'
import { CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react'
import { ScheduleWeekGroup } from './ScheduleWeekGroup'
import type { ScheduleWeek } from '../shared/types'

type ScheduleTab = 'schedule' | 'tasks'

interface ScheduleSectionProps {
  weeks: Array<ScheduleWeek>
  pendingTaskCount: number
}

// Card containing the schedule / pending-tasks tab switch and the schedule feed.
export function ScheduleSection({ weeks, pendingTaskCount }: ScheduleSectionProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('schedule')

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <TabButton
          isActive={activeTab === 'schedule'}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarBlank size={18} weight="bold" />
          My Schedule
        </TabButton>
        <TabButton
          isActive={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        >
          <ClockCounterClockwise size={18} weight="bold" />
          Pending Tasks
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#ED0331] text-[11px] font-semibold text-white">
            {pendingTaskCount}
          </span>
        </TabButton>
      </div>

      {activeTab === 'schedule' ? (
        <ScheduleFeed weeks={weeks} />
      ) : (
        <EmptyTasksState />
      )}
    </section>
  )
}

function ScheduleFeed({ weeks }: { weeks: Array<ScheduleWeek> }) {
  if (weeks.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Nothing scheduled right now.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {weeks.map((week) => (
        <ScheduleWeekGroup key={week.id} week={week} />
      ))}
    </div>
  )
}

function EmptyTasksState() {
  return (
    <p className="py-10 text-center text-sm text-gray-400">
      You&apos;re all caught up on tasks.
    </p>
  )
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC] ${
        isActive
          ? 'border-[#6962AC] bg-[#6962AC]/10 text-[#6962AC]'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}
