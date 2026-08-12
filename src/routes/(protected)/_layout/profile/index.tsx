import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/features/profile/ProfilePage'
import { PROFILE_TABS } from '@/components/features/profile/profileTabsConfig'
import type { ProfileTab } from '@/components/features/profile/profileTabsConfig'

const VALID_TABS = new Set<string>(PROFILE_TABS)

export const Route = createFileRoute('/(protected)/_layout/profile/')({
  validateSearch: (raw): { tab?: ProfileTab } => ({
    // An unknown value resolves to the first available tab at render time; the
    // gating flags needed to know which tabs exist aren't loaded here yet.
    tab:
      typeof raw.tab === 'string' && VALID_TABS.has(raw.tab)
        ? (raw.tab as ProfileTab)
        : undefined,
  }),
  component: ProfilePage,
})
