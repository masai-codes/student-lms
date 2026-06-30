import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, History } from 'lucide-react'
import { extractSpanningItems, groupItemsByWeek } from '../shared/scheduleUtils'
import { ScheduleWeekGroupSection } from './ScheduleWeekGroup'
import { ScheduleCard } from './schedule-card/ScheduleCard'
import type { DashboardScheduleItem, ScheduleWeekGroup } from '../shared/types'
import { AppLoading } from '@/components/common'
import { fetchDashboardPendingTasks } from '@/lib/api/dashboard/dashboardApi'
import { useServerTime } from '@/hooks/useServerTime'

type ScheduleTab = 'schedule' | 'pending'

interface DashboardScheduleSectionProps {
  items: Array<DashboardScheduleItem>
  isLoading: boolean
  pendingTasksCount: number
  queryEnabled?: boolean
}

export function DashboardScheduleSection({
  items,
  isLoading,
  pendingTasksCount,
  queryEnabled = true,
}: DashboardScheduleSectionProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('schedule')
  const [pendingTabActivated, setPendingTabActivated] = useState(false)
  const { now } = useServerTime()

  const { data: pendingTasksData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['dashboard-pending-tasks'],
    queryFn: fetchDashboardPendingTasks,
    enabled: pendingTabActivated && queryEnabled,
  })

  function handlePendingTabClick() {
    setPendingTabActivated(true)
    setActiveTab('pending')
  }

  // Items that span the entire week are excluded from My Schedule
  // and surfaced in Pending Tasks instead
  const spanningItems = extractSpanningItems(items, now)
  const spanningIds = new Set(spanningItems.map((i) => i.id))
  const scheduleItems = items.filter((i) => !spanningIds.has(i.id))
  const effectivePendingItems = [...(pendingTasksData ?? []), ...spanningItems]

  const badgeCount = pendingTabActivated && !isPendingLoading
    ? effectivePendingItems.length
    : pendingTasksCount + spanningItems.length

  const weekGroups: Array<ScheduleWeekGroup> =
    activeTab === 'schedule' ? groupItemsByWeek(scheduleItems, now) : []

  return (
    <div className="lg:bg-[#F9FAFB] lg:rounded-t-xl lg:rounded-b-[20px] lg:border lg:border-gray-200 lg:overflow-hidden">
      <div className="flex items-center gap-3 lg:px-5 lg:pt-5 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-1 lg:flex-none justify-center items-center gap-1.5 px-3 py-2 h-10 rounded-[8px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
            activeTab === 'schedule'
              ? 'bg-[#EBF5FF] border border-[#6962AC] text-[#6962AC]'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CalendarDays size={20} />
          My Schedule
        </button>

        <button
          type="button"
          onClick={handlePendingTabClick}
          className={`flex flex-1 lg:flex-none justify-center items-center gap-1.5 px-3 py-2 h-10 rounded-[8px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
            activeTab === 'pending'
              ? 'bg-[#EBF5FF] border border-[#6962AC] text-[#6962AC]'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Clock size={20} />
          Pending Tasks
          {badgeCount > 0 ? (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#F05252] text-white text-[11px] font-medium">
              {badgeCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="hidden lg:block h-px bg-gray-200 mt-5" />

      <div className="lg:px-5 lg:pb-5 pt-4">
        {/* Schedule tab */}
        {isLoading && activeTab === 'schedule' ? (
          <AppLoading label="Loading schedule..." />
        ) : null}

        {!isLoading && activeTab === 'schedule' ? (
          weekGroups.length === 0 ? (
            <p className="type-b2 text-gray-400 text-center py-8">
              No sessions scheduled this week.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {weekGroups.map((group) => (
                <ScheduleWeekGroupSection key={group.weekLabel} group={group} />
              ))}
            </div>
          )
        ) : null}

        {/* Pending tasks tab */}
        {isPendingLoading && activeTab === 'pending' ? (
          <AppLoading label="Loading pending tasks..." />
        ) : null}

        {!isPendingLoading && activeTab === 'pending' ? (
          effectivePendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <History size={64} strokeWidth={1.75} className="text-gray-300" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">No pending tasks</p>
                <p className="mt-1 text-sm text-gray-400">No pending tasks at the moment.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {effectivePendingItems.map((item) => (
                <ScheduleCard
                  key={`pending-${item.id}`}
                  item={item}
                  dayLabel={null}
                  isToday={false}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
