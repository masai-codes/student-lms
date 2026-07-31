import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

const FLOW_ID = 'masaiverse-access'

export const masaiverseAccessConfig: SeedFlowMeta = {
  id: FLOW_ID,
  description:
    'Student enrolled in a batch with `show_masaiverse` enabled — sees "Community" surface MasaiVerse (not the Refer & Earn fallback) in the navbar and gets in via `/masaiverse`.',
  timing: {},
  seedCommand: `npm run seed ${FLOW_ID}`,
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(FLOW_ID, 'admin') },
    { role: 'student', email: flowScopedEmail(FLOW_ID, 'student') },
  ],
  primaryLoginRole: 'student',
}
