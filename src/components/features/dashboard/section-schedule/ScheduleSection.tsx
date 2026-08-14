import { useState } from 'react'
import {
  CalendarBlankIcon,
  ClockCounterClockwiseIcon,
} from '@phosphor-icons/react'
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
      // Borderless below `md`, so no inner side padding there: the dashboard
      // column's own gutter already insets it, and doubling up pushed this
      // section further in than the sidebar cards next to it.
      className="flex h-full flex-col gap-5 rounded-2xl md:border border-border md:bg-surface py-2 px-0 md:p-4 transition-colors duration-300 hover:border-[#4F6BED]/25 dark:hover:border-brand/30 sm:p-5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <TabButton
          isActive={activeTab === 'schedule'}
          onClick={() => {
            pushDashboardEvent('l_dashboard_schedule_tab', { tab: 'schedule' })
            setActiveTab('schedule')
          }}
          testId="dashboard-schedule-tab"
        >
          <CalendarBlankIcon size={18} weight="bold" className="shrink-0" />
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
          <ClockCounterClockwiseIcon
            size={18}
            weight="bold"
            className="shrink-0"
          />
          Pending Tasks
          {pendingTasks.length > 0 && (
            <span
              data-testid="dashboard-pending-tasks-count"
              className="animate-dash-pop inline-flex size-4 md:size-4 shrink-0 items-center justify-center rounded-full bg-danger text-[9px] md:text-[11px] font-semibold text-danger-foreground shadow-[0_0_0_3px_rgb(237_3_49_/_0.12)] [--dash-delay:0.5s]"
            >
              {pendingTasks.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* Keyed on the tab so each switch replays the entrance animation. */}
      <div key={activeTab} className="animate-dash-row-in">
        {activeTab === 'schedule' ? (
          <ScheduleFeed
            schedule={schedule}
            isLoading={isLoading}
            isError={isError}
            now={now}
          />
        ) : (
          <PendingTasksFeed
            tasks={pendingTasks}
            isLoading={isLoading}
            isError={isError}
          />
        )}
      </div>
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
      <div
        data-testid="dashboard-schedule-loading"
        className="flex flex-col gap-4"
      >
        <span className="sr-only">Loading…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-stretch gap-3">
            <div className="dash-skeleton h-12 w-11 shrink-0 rounded-lg" />
            <div
              className="dash-skeleton h-16 flex-1 rounded-xl"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          </div>
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <p
        data-testid="dashboard-schedule-error"
        className="py-10 text-center text-sm text-foreground-subtle"
      >
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
          className="shrink-0 text-sm font-semibold text-foreground"
        >
          {week.rangeLabel}
        </span>
        <span
          className="h-px flex-1 bg-gradient-to-r from-[#4F6BED]/30 dark:from-brand/30 via-gray-200 dark:via-border to-transparent"
          aria-hidden
        />
      </div>

      {week.days.map((day, index) => (
        <ScheduleDay key={day.key} day={day} index={index} />
      ))}
    </div>
  )
}

function ScheduleDay({ day, index }: { day: ScheduleDayRow; index: number }) {
  return (
    <div
      data-testid={`dashboard-schedule-day-${day.key}`}
      className="animate-dash-row-in flex flex-col lg:flex-row items-stretch gap-3"
      style={{ '--dash-delay': `${index * 0.06}s` } as React.CSSProperties}
    >
      <DayBadge day={day} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {day.items.length === 0 ? (
          <div className="flex items-center rounded-xl border border-dashed border-border bg-surface-muted/60 px-4 py-4 text-sm text-foreground-subtle">
            No sessions scheduled for the day
          </div>
        ) : (
          day.items.map((item) => (
            <div key={`${item.learningType}-${item.id}`} className="rounded-xl">
              <LearnContentCard
                item={scheduleItemToLearnContent(item, {
                  includeDeadlineLabel: false,
                })}
                fromDashboard
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DayBadge({ day }: { day: ScheduleDayRow }) {
  return (
    <div
      className={`flex h-fit w-11 shrink-0 flex-col items-center rounded-lg py-1.5 transition-transform duration-200 ${
        day.isToday
          ? 'animate-dash-glow bg-gradient-to-b from-[#5F79F2] to-[#4F6BED] text-white dark:from-brand dark:to-[#c93a3a]'
          : 'text-foreground-muted hover:bg-surface-muted'
      }`}
    >
      <span className="text-[11px] font-semibold uppercase leading-none">
        {day.weekday}
      </span>
      <span
        className={`text-base font-bold leading-tight ${day.isToday ? '' : 'text-foreground'}`}
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
      <div
        data-testid="dashboard-pending-tasks-loading"
        className="flex flex-col gap-3"
      >
        <span className="sr-only">Loading…</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="dash-skeleton h-16 rounded-xl"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <p
        data-testid="dashboard-pending-tasks-error"
        className="py-10 text-center text-sm text-foreground-subtle"
      >
        Failed to load content
      </p>
    )
  }
  if (tasks.length === 0) {
    return (
      <div
        data-testid="dashboard-pending-tasks-empty"
        className="flex flex-col items-center gap-2 py-10 text-center"
      >
        <span
          aria-hidden
          className="animate-dash-pop flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-500/20 text-xl shadow-[0_0_0_6px_rgb(16_185_129_/_0.08)]"
        >
          🎉
        </span>
        <p className="text-sm font-medium text-foreground-muted">
          You&apos;re all caught up on tasks.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="dashboard-pending-tasks-feed"
      className="flex flex-col gap-3"
    >
      {tasks.map((item) => (
        <div key={`${item.learningType}-${item.id}`}>
          <LearnContentCard
            item={scheduleItemToLearnContent(item, {
              includeDeadlineLabel: true,
            })}
            fromDashboard
          />
        </div>
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
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2.5 text-center text-xs md:text-sm font-semibold leading-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.97] sm:flex-none sm:gap-2 sm:px-4 ${
        isActive
          ? 'border-brand text-brand'
          : 'border-border bg-surface text-foreground-muted hover:-translate-y-px hover:border-brand/40 hover:bg-surface-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
