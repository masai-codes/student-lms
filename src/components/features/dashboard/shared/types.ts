// Shared types for the dashboard feature.
//
// The live sections (welcome banners, announcements, product updates, support
// session) are driven by the consolidated overview query and use the server
// DTOs directly (see `DashboardOverviewState`). Only the still-static sections
// (profile banner, welcome name, schedule) live in `DashboardData`.

import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from '@/server/api/dashboard/announcements/announcementFeed'
import type { DashboardProductUpdate } from '@/server/api/dashboard/product-updates/getProductUpdates.service'
import type { DashboardSupportSession } from '@/server/api/dashboard/support/getSupportSessions.service'

export type ScheduleItemType = 'lecture' | 'assignment' | 'notes'

export interface ScheduleItem {
  id: string
  type: ScheduleItemType
  title: string
  /** Human-readable time range, e.g. "10AM - 11:30 AM". */
  timeLabel: string
  courseCode: string
  /** e.g. "Tutorial", "Practice", "Notes". */
  category: string
  module: string
}

export interface ScheduleDay {
  id: string
  /** Short weekday label, e.g. "Wed". */
  weekday: string
  /** Day-of-month, e.g. "08". */
  dayOfMonth: string
  /** Whether this day should render with the accent (current day) treatment. */
  isActive: boolean
  items: Array<ScheduleItem>
}

export interface ScheduleWeek {
  id: string
  /** Range label for the week, e.g. "JAN 08-15". */
  label: string
  days: Array<ScheduleDay>
}

/** Still-static dashboard sections (mock-driven). */
export interface DashboardData {
  studentName: string
  profileActionLabel: string
  pendingTaskCount: number
  scheduleWeeks: Array<ScheduleWeek>
}

/**
 * Live overview sections + the shared query state. Cards render their own
 * loading / error / empty states from this.
 */
export interface DashboardOverviewState {
  isPending: boolean
  isError: boolean
  banners: Array<DashboardBanner>
  announcements: Array<DashboardAnnouncement>
  productUpdates: Array<DashboardProductUpdate>
  supportSession: DashboardSupportSession | null
}
