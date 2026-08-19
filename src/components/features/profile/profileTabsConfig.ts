import type { ProfileOverview } from '@/server/api/profile/profile.types'

export const PROFILE_TABS = [
  'details',
  'student-kit',
  'undertakings',
  'activity',
  'certificates',
  'invoices',
  'email-preferences',
] as const

export type ProfileTab = (typeof PROFILE_TABS)[number]

export const DEFAULT_PROFILE_TAB: ProfileTab = 'details'

interface ProfileTabDefinition {
  id: ProfileTab
  label: string
  /** Absent = always available. */
  isAvailable?: (profile: ProfileOverview) => boolean
}

/**
 * Tab order and gating, ported from the old LMS with two changes:
 *  - "acknowledgement" is now the properly-cased "Acknowledgements".
 *  - Certificates is always present (the old build-time `CERTIFICATE_VIEW` flag
 *    is gone); an empty state covers students with none.
 */
const TAB_DEFINITIONS: ReadonlyArray<ProfileTabDefinition> = [
  { id: 'details', label: 'Profile Details' },
  {
    id: 'student-kit',
    label: 'Student Kit',
    isAvailable: (profile) => profile.hasFullFees && profile.isNewUserJourney,
  },
  { id: 'undertakings', label: 'Acknowledgements' },
  { id: 'activity', label: 'Account Activity' },
  { id: 'certificates', label: 'Certificates' },
  {
    id: 'invoices',
    label: 'My Invoices',
    isAvailable: (profile) => profile.isNewUserJourney,
  },
  { id: 'email-preferences', label: 'Email Preferences' },
]

export interface ResolvedProfileTab {
  id: ProfileTab
  label: string
}

/** The tabs this student can actually see, in display order. */
export function resolveProfileTabs(
  profile: ProfileOverview | undefined,
): Array<ResolvedProfileTab> {
  return TAB_DEFINITIONS.filter(
    (tab) => !tab.isAvailable || (profile ? tab.isAvailable(profile) : false),
  ).map((tab) => ({ id: tab.id, label: tab.label }))
}

/**
 * The tab to actually render: the requested one when it is visible to this
 * student, otherwise the default. Guards both unknown `?tab=` values and tabs
 * the student has lost access to (e.g. a bookmarked Invoices link).
 */
export function resolveActiveProfileTab(
  requested: string | undefined,
  tabs: Array<ResolvedProfileTab>,
): ProfileTab {
  const match = tabs.find((tab) => tab.id === requested)
  return match ? match.id : (tabs.at(0)?.id ?? DEFAULT_PROFILE_TAB)
}
