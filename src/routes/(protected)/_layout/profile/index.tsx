import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/features/profile/ProfilePage'

export type ProfileTab =
  | 'profile-details'
  | 'zoom-integrations'
  | 'acknowledgement'
  | 'account-activity'
  | 'certificates'
  | 'email-preferences'

const VALID_TABS: Array<ProfileTab> = [
  'profile-details',
  'zoom-integrations',
  'acknowledgement',
  'account-activity',
  'certificates',
  'email-preferences',
]

export const Route = createFileRoute('/(protected)/_layout/profile/')({
  validateSearch: (raw): { tab: ProfileTab } => {
    const tab = typeof raw.tab === 'string' && VALID_TABS.includes(raw.tab as ProfileTab)
      ? (raw.tab as ProfileTab)
      : 'profile-details'
    return { tab }
  },
  component: ProfilePage,
})
