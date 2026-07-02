// Shared types for the dashboard feature. Kept UI-only for now (static data);
// these mirror the shapes we expect the API to eventually return.

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

export interface WelcomeBanner {
  id: string
  title: string
  subtitle: string
}

export interface Announcement {
  id: string
  title: string
  author: string
  isForYou: boolean
}

export interface ProductUpdate {
  id: string
  title: string
}

export interface DashboardData {
  studentName: string
  profileActionLabel: string
  welcomeBanners: Array<WelcomeBanner>
  pendingTaskCount: number
  scheduleWeeks: Array<ScheduleWeek>
  announcements: Array<Announcement>
  productUpdates: Array<ProductUpdate>
}
