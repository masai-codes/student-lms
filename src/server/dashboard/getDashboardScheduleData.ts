export type DashboardLearningType = 'lecture' | 'assignment' | 'resource'

export interface DashboardScheduleItem {
  id: number
  learningType: DashboardLearningType
  title: string
  schedule: string | null
  concludes: string | null
  batchName: string | null
  subType: string | null
  moduleName: string | null
  optional: 0 | 1
}
