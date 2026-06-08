import { useState } from 'react'
import { CalendarDays, Clock, History } from 'lucide-react'
import { extractSpanningItems, groupItemsByWeek } from '../shared/scheduleUtils'
import { ScheduleWeekGroupSection } from './ScheduleWeekGroup'
import { ScheduleCard } from './schedule-card/ScheduleCard'
import type { DashboardScheduleItem, ScheduleWeekGroup } from '../shared/types'
import { AppLoading } from '@/components/common'

type ScheduleTab = 'schedule' | 'pending'

interface DashboardScheduleSectionProps {
  items: Array<DashboardScheduleItem>
  pendingItems: Array<DashboardScheduleItem>
  isLoading: boolean
  isPendingLoading: boolean
}

export function DashboardScheduleSection({
  items,
  pendingItems,
  isLoading,
  isPendingLoading,
}: DashboardScheduleSectionProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('schedule')

  // Items that span the entire week are excluded from My Schedule
  // and surfaced in Pending Tasks instead
  const spanningItems = extractSpanningItems(items)
  const spanningIds = new Set(spanningItems.map((i) => i.id))
  const scheduleItems = items.filter((i) => !spanningIds.has(i.id))
  const effectivePendingItems = [...pendingItems, ...spanningItems]

  const weekGroups: Array<ScheduleWeekGroup> =
    activeTab === 'schedule' ? groupItemsByWeek(scheduleItems) : []

  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
            activeTab === 'schedule'
              ? 'bg-[#EBF5FF] border border-primary-700 text-primary-700'
              : 'bg-white border border-grey-200 text-[#6C7280] hover:bg-gray-50'
          }`}
        >
          <CalendarDays size={16} />
          My Schedule
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
            activeTab === 'pending'
              ? 'bg-[#EBF5FF] border border-primary-700 text-primary-700'
              : 'bg-white border border-grey-200 text-[#6C7280] hover:bg-gray-50'
          }`}
        >
          <Clock size={16} />
          Pending Tasks
          {effectivePendingItems.length > 0 ? (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-500 text-white text-xs font-semibold">
              {effectivePendingItems.length}
            </span>
          ) : null}
        </button>
      </div>

      <div className="h-px bg-gray-100 mt-3" />

      <div className="p-4 max-h-[560px] overflow-y-auto">
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
            <div className="flex flex-col gap-6">
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
