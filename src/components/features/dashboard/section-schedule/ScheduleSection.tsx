import { useState } from 'react'
import { CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react'
import {
  buildScheduleWeek,
  scheduleItemToLearnContent,
} from '../shared/scheduleMapping'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { ScheduleDayRow } from '../shared/scheduleMapping'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'
import { LearnContentCard } from '@/components/features/learn/section-three/content-card/LearnContentCard'

type ScheduleTab = 'schedule' | 'tasks'

interface ScheduleSectionProps {
  schedule: Array<DashboardScheduleItem>
  pendingTasks: Array<DashboardScheduleItem>
  isLoading: boolean
  isError: boolean
  /** Injectable for deterministic tests; defaults to the current time. */
  now?: Date
}

// Schedule / pending-tasks tab switch. Both tabs render the reused `/learn`
// `LearnContentCard`: "My Schedule" is the 7-day feed (a row per day, empty days
// included); "Pending Tasks" is the not-begun assignments + catch-up lectures.
// The tab badge counts pending items.
export function ScheduleSection({
  schedule,
  pendingTasks,
  isLoading,
  isError,
  now = new Date(),
}: ScheduleSectionProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('schedule')

  return (
    <section
      data-testid="dashboard-schedule-section"
      className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-center gap-3">
        <TabButton
          isActive={activeTab === 'schedule'}
          onClick={() => {
            pushDashboardEvent('l_dashboard_schedule_tab', { tab: 'schedule' })
            setActiveTab('schedule')
          }}
          testId="dashboard-schedule-tab"
        >
          <CalendarBlank size={18} weight="bold" />
          My Schedule
        </TabButton>
        <TabButton
          isActive={activeTab === 'tasks'}
          onClick={() => {
            pushDashboardEvent('l_dashboard_pending_tasks_tab', {
              tab: 'tasks',
              pending_count: pendingTasks.length,
            })
            setActiveTab('tasks')
          }}
          testId="dashboard-pending-tasks-tab"
        >
          <ClockCounterClockwise size={18} weight="bold" />
          Pending Tasks
          {pendingTasks.length > 0 && (
            <span
              data-testid="dashboard-pending-tasks-count"
              className="inline-flex size-5 items-center justify-center rounded-full bg-[#ED0331] text-[11px] font-semibold text-white"
            >
              {pendingTasks.length}
            </span>
          )}
        </TabButton>
      </div>

      {activeTab === 'schedule' ? (
        <ScheduleFeed schedule={schedule} isLoading={isLoading} isError={isError} now={now} />
      ) : (
        <PendingTasksFeed tasks={pendingTasks} isLoading={isLoading} isError={isError} />
      )}
    </section>
  )
}

function ScheduleFeed({
  schedule,
  isLoading,
  isError,
  now,
}: {
  schedule: Array<DashboardScheduleItem>
  isLoading: boolean
  isError: boolean
  now: Date
}) {
  if (isLoading) {
    return (
      <p data-testid="dashboard-schedule-loading" className="py-10 text-center text-sm text-gray-400">
        Loading…
      </p>
    )
  }
  if (isError) {
    return (
      <p data-testid="dashboard-schedule-error" className="py-10 text-center text-sm text-gray-400">
        Failed to load content
      </p>
    )
  }

  const week = buildScheduleWeek(schedule, now)

  return (
    <div data-testid="dashboard-schedule-feed" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          data-testid="dashboard-schedule-range"
          className="shrink-0 text-sm font-semibold text-gray-800"
        >
          {week.rangeLabel}
        </span>
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
      </div>

      {week.days.map((day) => (
        <ScheduleDay key={day.key} day={day} />
      ))}
    </div>
  )
}

function ScheduleDay({ day }: { day: ScheduleDayRow }) {
  return (
    <div data-testid={`dashboard-schedule-day-${day.key}`} className="flex items-stretch gap-3">
      <DayBadge day={day} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {day.items.length === 0 ? (
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-400">
            No sessions scheduled for the day
          </div>
        ) : (
          day.items.map((item) => (
            <LearnContentCard
              key={`${item.learningType}-${item.id}`}
              item={scheduleItemToLearnContent(item)}
              fromDashboard
            />
          ))
        )}
      </div>
    </div>
  )
}

function DayBadge({ day }: { day: ScheduleDayRow }) {
  return (
    <div
      className={`flex h-fit w-11 shrink-0 flex-col items-center rounded-lg py-1.5 ${
        day.isToday ? 'bg-[#4F6BED] text-white' : 'text-gray-500'
      }`}
    >
      <span className="text-[11px] font-semibold uppercase leading-none">{day.weekday}</span>
      <span
        className={`text-base font-bold leading-tight ${day.isToday ? '' : 'text-gray-700'}`}
      >
        {day.dayOfMonth}
      </span>
    </div>
  )
}

function PendingTasksFeed({
  tasks,
  isLoading,
  isError,
}: {
  tasks: Array<DashboardScheduleItem>
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) {
    return (
      <p data-testid="dashboard-pending-tasks-loading" className="py-10 text-center text-sm text-gray-400">
        Loading…
      </p>
    )
  }
  if (isError) {
    return (
      <p data-testid="dashboard-pending-tasks-error" className="py-10 text-center text-sm text-gray-400">
        Failed to load content
      </p>
    )
  }
  if (tasks.length === 0) {
    return (
      <p
        data-testid="dashboard-pending-tasks-empty"
        className="py-10 text-center text-sm text-gray-400"
      >
        You&apos;re all caught up on tasks.
      </p>
    )
  }

  return (
    <div data-testid="dashboard-pending-tasks-feed" className="flex flex-col gap-3">
      {tasks.map((item) => (
        <LearnContentCard
          key={`${item.learningType}-${item.id}`}
          item={scheduleItemToLearnContent(item)}
          fromDashboard
        />
      ))}
    </div>
  )
}

function TabButton({
  isActive,
  onClick,
  testId,
  children,
}: {
  isActive: boolean
  onClick: () => void
  testId: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
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
