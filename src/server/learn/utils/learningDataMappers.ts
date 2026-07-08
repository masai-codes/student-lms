import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { ResourcePhase } from '@/server/learn/resourceDetailTypes'
import type {
  LearnListingCardCtas,
  LearningItem,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import { resolveLectureLearningType } from '@/server/learn/utils/resolveLectureLearningType'

export interface LearningEntityRow {
  id: number
  title: string
  category: string
  type: string
  optional: number | null
  schedule: string | null
  concludes?: string | null
  sectionId?: number | null
  week: number
  /** DB `module` column; when empty, UI falls back to `Module {week}`. */
  module: string | null
  hostName: string | null
  zoomLink?: string | null
  /** `lectures.is_new_zoom_redirection` (tinyint 0/1); ZEF join flow when 1. */
  isNewZoomRedirection?: number | null
}

export function toLearningPriority(optional: number | null): LearningPriority {
  return optional === 1 ? 'recommended' : 'mandatory'
}

export function toModuleName(week: number): string {
  return `Module ${week}`
}

/** Prefer stored `module` label; otherwise legacy `Module {week}` from week index. */
export function resolveModuleName(module: string | null | undefined, week: number): string {
  const label = module?.trim()
  if (label) {
    return label
  }
  return toModuleName(week)
}

export function mapLearningEntityRow(
  row: LearningEntityRow,
  sourceLearningType: LearningType,
  listingCtas: LearnListingCardCtas,
  attendance: LectureAttendanceSummary | null = null,
  assignmentProgressStatus: AssignmentProgressStatus | null = null,
  resourcePhase: ResourcePhase | null = null,
): LearningItem {
  const learningType =
    sourceLearningType === 'assignment'
      ? 'assignment'
      : resolveLectureLearningType(row.type)

  const isRecommended = toLearningPriority(row.optional) === 'recommended'

  return {
    id: row.id,
    learningType,
    title: row.title,
    hostName: row.hostName ?? 'Unknown Instructor',
    scheduleDate: row.schedule,
    concludes: row.concludes ?? null,
    type: row.type,
    category: row.category,
    isOptional: toLearningPriority(row.optional),
    moduleName: resolveModuleName(row.module, row.week),
    attendance:
      learningType === 'lecture' && !isRecommended ? attendance : null,
    assignmentProgressStatus: learningType === 'assignment' ? assignmentProgressStatus : null,
    resourcePhase: learningType === 'resource' ? resourcePhase : null,
    listingCtas,
  }
}
