import type {
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
  week: number
  /** DB `module` column; when empty, UI falls back to `Module {week}`. */
  module: string | null
  hostName: string | null
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
  sourceLearningType: LearningType
): LearningItem {
  return {
    id: row.id,
    learningType:
      sourceLearningType === 'assignment'
        ? 'assignment'
        : resolveLectureLearningType(row.type),
    title: row.title,
    hostName: row.hostName ?? 'Unknown Instructor',
    scheduleDate: row.schedule,
    type: row.type,
    category: row.category,
    isOptional: toLearningPriority(row.optional),
    moduleName: resolveModuleName(row.module, row.week),
  }
}
