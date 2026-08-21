import type { AchievementItem } from '@/server/api/profile/profile.types'

export const NO_COURSE_LABEL = 'Other'
export const NO_MODULE_LABEL = 'General'

interface AchievementModuleGroup {
  name: string
  count: number
  items: Array<AchievementItem>
}

export interface AchievementCourseGroup {
  name: string
  count: number
  modules: Array<AchievementModuleGroup>
}

/** Earned badges first; locked ones trail behind, order otherwise preserved. */
export function sortLockedLast(
  items: Array<AchievementItem>,
): Array<AchievementItem> {
  return [...items].sort((a, b) => Number(a.isLocked) - Number(b.isLocked))
}

/**
 * Groups the flat achievements list into programme → module, preserving first-seen
 * order at both levels so the display is stable across refetches.
 */
export function groupAchievements(
  items: Array<AchievementItem>,
): Array<AchievementCourseGroup> {
  const byCourse = new Map<string, Map<string, Array<AchievementItem>>>()

  for (const item of items) {
    const course = item.courseTitle?.trim() || NO_COURSE_LABEL
    const moduleName = item.sectionModuleName?.trim() || NO_MODULE_LABEL

    if (!byCourse.has(course)) byCourse.set(course, new Map())
    const modules = byCourse.get(course)!
    if (!modules.has(moduleName)) modules.set(moduleName, [])
    modules.get(moduleName)!.push(item)
  }

  return [...byCourse.entries()].map(([courseName, modules]) => {
    const moduleGroups = [...modules.entries()].map(([name, moduleItems]) => ({
      name,
      count: moduleItems.length,
      items: sortLockedLast(moduleItems),
    }))

    return {
      name: courseName,
      count: moduleGroups.reduce((total, group) => total + group.count, 0),
      modules: moduleGroups,
    }
  })
}

/**
 * Keeps a selection valid as data loads or changes: falls back to the first
 * available option rather than rendering an empty grid for a stale name.
 */
export function resolveSelection(
  requested: string | null,
  available: Array<{ name: string }>,
): string | null {
  if (requested && available.some((option) => option.name === requested)) {
    return requested
  }
  return available.at(0)?.name ?? null
}

/** Public badge landing page URL, or null when sharing isn't configured. */
export function buildBadgeShareUrl(
  shareBaseUrl: string | null,
  shareKey: string | null,
): string | null {
  if (!shareBaseUrl || !shareKey) return null
  return `${shareBaseUrl}/badge/${shareKey}`
}
