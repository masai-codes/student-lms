import { resolveModuleName } from '@/server/learn/utils/learningDataMappers'

/** Unique resolved module labels for facet rows (no search/filters applied). */
export function buildModuleFilterValuesFromModuleWeekRows(
  rows: Array<{ module: string | null; week: number }>,
): Array<string> {
  return Array.from(
    new Set(rows.map((r) => resolveModuleName(r.module, r.week))),
  ).sort()
}
