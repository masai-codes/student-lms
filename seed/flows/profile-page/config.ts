import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const PROFILE_PAGE_FLOW_ID = 'profile-page' as const
export type ProfilePageFlowId = typeof PROFILE_PAGE_FLOW_ID

export const profilePageConfig: SeedFlowMeta = {
  id: PROFILE_PAGE_FLOW_ID,
  description:
    'Profile page test bed: header (avatar-less initials, two student codes across two batches), Achievements (2 programs x modules, earned + locked + repeat award), Acknowledgements (one pending undertaking), Account Activity (3 devices), plus the full-fees + new-user-journey flags that unlock the Student Kit and My Invoices tabs.',
  timing: {},
  seedCommand: `npm run seed ${PROFILE_PAGE_FLOW_ID}`,
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(PROFILE_PAGE_FLOW_ID, 'admin') },
    {
      role: 'student',
      email: flowScopedEmail(PROFILE_PAGE_FLOW_ID, 'student'),
    },
  ],
  primaryLoginRole: 'student',
}
