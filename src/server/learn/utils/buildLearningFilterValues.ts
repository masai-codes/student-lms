import type { LearningFilterValues, LearningItem } from '@/server/learn/types'
import { resolveModuleName } from '@/server/learn/utils/learningDataMappers'

/** Unique resolved module labels for facet rows (no search/filters applied). */
export function buildModuleFilterValuesFromModuleWeekRows(
  rows: Array<{ module: string | null; week: number }>,
): Array<string> {
  return Array.from(new Set(rows.map((r) => resolveModuleName(r.module, r.week)))).sort()
}

export function buildLearningFilterValues(items: Array<LearningItem>): LearningFilterValues {
  const moduleFilterValues = Array.from(new Set(items.map((item) => item.moduleName))).sort()
  const categoryFilterValues = Array.from(new Set(items.map((item) => item.category))).sort()
  const typeFilterValues = Array.from(new Set(items.map((item) => item.type))).sort()
  const priorityFilterValues = Array.from(new Set(items.map((item) => item.isOptional))).sort()
  const instructorFilterValues = Array.from(new Set(items.map((item) => item.hostName))).sort()

  return {
    moduleFilterValues,
    categoryFilterValues,
    typeFilterValues,
    priorityFilterValues,
    instructorFilterValues,
  }
}
