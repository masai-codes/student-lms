import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

const FLOW_ID = 'app-installed'

export const appInstalledConfig: SeedFlowMeta = {
  id: FLOW_ID,
  description:
    'Student with an active `user_device_tokens` row — the navbar treats the mobile app as already installed, so "Get the app" is omitted and "Refer & Earn" renders as the primary (labeled) action instead.',
  timing: {},
  seedCommand: `npm run seed ${FLOW_ID}`,
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(FLOW_ID, 'admin') },
    { role: 'student', email: flowScopedEmail(FLOW_ID, 'student') },
  ],
  primaryLoginRole: 'student',
}
