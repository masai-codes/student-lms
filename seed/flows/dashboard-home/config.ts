import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const DASHBOARD_HOME_FLOW_ID = 'dashboard-home' as const
export type DashboardHomeFlowId = typeof DASHBOARD_HOME_FLOW_ID

export const dashboardHomeConfig: SeedFlowMeta = {
  id: DASHBOARD_HOME_FLOW_ID,
  description:
    'Dashboard home test bed: My Schedule (7-day window + empty days), Pending Tasks (catch-up lecture + open assignment), Announcements (Feed A + For You, cap 5), Product Updates (top 5 of 7). No T0 overlay.',
  timing: {},
  seedCommand: `npm run seed ${DASHBOARD_HOME_FLOW_ID}`,
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(DASHBOARD_HOME_FLOW_ID, 'admin') },
    { role: 'student', email: flowScopedEmail(DASHBOARD_HOME_FLOW_ID, 'student') },
  ],
  primaryLoginRole: 'student',
}
