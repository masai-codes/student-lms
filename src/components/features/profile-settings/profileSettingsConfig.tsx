import { Briefcase, SealCheck, Shield, UsersFour } from '@phosphor-icons/react'

import type { NavItem } from '@/lib/navigation/navItemConfig'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

export const PRIVACY_POLICY_URL = 'https://www.masaischool.com/privacy-policy'

/** Practice interview still lives on the legacy student app. */
const PRACTICE_INTERVIEW_PATH = '/practice-interview'

type ProfileSettingsGating = {
  /** iHub / IIT Jodhpur hide the Masai-only rows (same gate as the navbar). */
  hideMasaiOnlyFeatures: boolean
  /** Per-batch MasaiVerse access, as already resolved for the navbar. */
  showMasaiVerse: boolean
}

/**
 * The rows this page owns: everything the old LMS lists in
 * `profileSettingsConfig.tsx` that has no counterpart in `useAppNavItems`.
 * My Programs, Bookmarks, Report a Bug, Level up, Refer & Earn and Sign out all
 * come from that hook instead, so their gating and handlers are never
 * duplicated here.
 *
 * Keep in sync with `experience-ui/apps/student-experience`
 * (`src/components/Dashboard/Common/Layout/profileSettingsConfig.tsx`).
 */
export function profileSettingsExtraItems(gating: ProfileSettingsGating): {
  masaiverse: NavItem | null
  privacyPolicy: NavItem | null
  practiceInterview: NavItem | null
  productUpdates: NavItem
} {
  const practiceInterviewHref = getOldStudentUiUrlForPath(
    PRACTICE_INTERVIEW_PATH,
  )

  return {
    masaiverse: gating.showMasaiVerse
      ? {
          id: 'masaiverse-community',
          type: 'internal-link',
          to: '/masaiverse',
          label: 'MasaiVerse Community',
          icon: UsersFour,
          uiType: 'tertiary',
        }
      : null,
    privacyPolicy: gating.hideMasaiOnlyFeatures
      ? null
      : {
          id: 'privacy-policy',
          type: 'external-link',
          href: PRIVACY_POLICY_URL,
          label: 'Privacy Policy',
          icon: Shield,
          uiType: 'tertiary',
        },
    practiceInterview:
      gating.hideMasaiOnlyFeatures || !practiceInterviewHref
        ? null
        : {
            id: 'practice-interview',
            type: 'external-link',
            href: practiceInterviewHref,
            label: 'Practice Interview',
            icon: Briefcase,
            uiType: 'tertiary',
          },
    productUpdates: {
      id: 'product-updates',
      type: 'internal-link',
      to: '/whats-new',
      label: 'Product Updates',
      icon: SealCheck,
      uiType: 'tertiary',
    },
  }
}
