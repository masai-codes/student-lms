import type { LearningFilterValues, LearningItem } from '@/server/learn/types'

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
