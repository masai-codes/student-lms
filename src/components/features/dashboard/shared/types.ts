import type { DashboardLearningType, DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'

export type { DashboardLearningType, DashboardScheduleItem }

export interface ScheduleDateGroup {
  dateKey: string
  date: Date
  dayLabel: string
  items: Array<DashboardScheduleItem>
}

export interface ScheduleWeekGroup {
  weekLabel: string
  dateGroups: Array<ScheduleDateGroup>
}
