import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from './constants'
import type { OnboardingFlowId } from './types'

export const ONBOARDING_FLOW_DESCRIPTIONS: Record<OnboardingFlowId, string> = {
  'onboarding-legacy-user': 'Enrolled student with no admission row — legacy user, no T0 UI.',
  'onboarding-welcome-modal': 'New-journey student who has not seen the welcome modal yet.',
  'onboarding-welcome-seen': 'New-journey student who already dismissed the welcome modal.',
  'onboarding-fees-unpaid': 'LMS walkthrough only with an active payment countdown banner.',
  'onboarding-fees-paid': 'Full fees paid — program onboarding tab unlocked, steps pending.',
  'onboarding-kit-waiting': 'Student kit details filled; waiting for admin tracking upload.',
  'onboarding-kit-tracking': 'Student kit tracking URL available for display.',
  'onboarding-agreement-pending': 'Program onboarding with agreement modal still pending.',
  'onboarding-complete': 'All onboarding steps complete — ID card unlocked.',
  'onboarding-fees-overdue': 'Course fee deadline passed without full payment.',
}

export const ONBOARDING_FLOW_IDS = Object.keys(
  ONBOARDING_FLOW_DESCRIPTIONS,
) as Array<OnboardingFlowId>

export function createOnboardingFlowMeta(flowId: OnboardingFlowId): SeedFlowMeta {
  return {
    id: flowId,
    description: ONBOARDING_FLOW_DESCRIPTIONS[flowId],
    timing: {},
    seedCommand: `npm run seed ${flowId}`,
    defaultCredentialEmails: [
      { role: 'admin', email: flowScopedEmail(flowId, 'admin') },
      { role: 'student', email: flowScopedEmail(flowId, 'student') },
    ],
    primaryLoginRole: 'student',
  }
}
