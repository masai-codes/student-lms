export type LearnTab = 'lectures' | 'assignments' | 'resources'

export type LearnContentType = 'lecture' | 'assignment' | 'resource'

export type AttendanceStatus = 'Present' | 'Absent' | 'Pending'

export interface LearnContentItem {
  id: string
  type: LearnContentType
  title: string
  hostName: string
  date: string
  tags: string[]
  attendanceStatus: AttendanceStatus
}
