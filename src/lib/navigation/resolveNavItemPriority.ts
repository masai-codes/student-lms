import type { NavItem } from './navItemConfig'

export type ResolvedNavItems = {
  primary: NavItem[]
  secondary: NavItem[]
  tertiary: NavItem[]
}

/**
 * Pure priority resolution: at most one `primary` item survives as primary
 * (the first one in input order); every other `primary`-tagged item is
 * demoted to secondary (icon-only). Items already `secondary` or `tertiary`
 * pass through untouched. Order is preserved within each bucket.
 */
export function resolveNavItemPriority(items: NavItem[]): ResolvedNavItems {
  const primary: NavItem[] = []
  const secondary: NavItem[] = []
  const tertiary: NavItem[] = []

  let primaryClaimed = false

  for (const item of items) {
    if (item.uiType === 'tertiary') {
      tertiary.push(item)
      continue
    }

    if (item.uiType === 'primary' && !primaryClaimed) {
      primaryClaimed = true
      primary.push(item)
      continue
    }

    secondary.push(item)
  }

  return { primary, secondary, tertiary }
}
