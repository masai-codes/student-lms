import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy `?tab=` values mapped to their new path-based routes. */
const TAB_TO_PATH = {
  home: '/masaiverse/home',
  events: '/masaiverse/events',
  discussions: '/masaiverse/discussions',
  leaderboard: '/masaiverse/leaderboard',
  // `resources` was removed in v2; fall back to home.
  resources: '/masaiverse/home',
} as const

type LegacyTab = keyof typeof TAB_TO_PATH

export const Route = createFileRoute('/(protected)/_layout/masaiverse/')({
  validateSearch: (search: Record<string, unknown>): { tab?: LegacyTab } => {
    const tab = search.tab
    if (
      tab === 'home' ||
      tab === 'events' ||
      tab === 'discussions' ||
      tab === 'leaderboard' ||
      tab === 'resources'
    ) {
      return { tab }
    }
    return {}
  },
  beforeLoad: ({ search }) => {
    const to = search.tab ? TAB_TO_PATH[search.tab] : '/masaiverse/home'
    // Preserve isApp (validated on the parent route); drop the legacy tab.
    throw redirect({ to, search: ({ isApp }) => ({ isApp }) })
  },
})
