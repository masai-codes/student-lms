import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from './constants'
import type { OnboardingFlowId } from './types'

export const ONBOARDING_FLOW_DESCRIPTIONS: Record<OnboardingFlowId, string> = {
  'onboarding-legacy-user':
    'Enrolled student with no admission row — legacy user, no T0 UI.',
  'onboarding-welcome-modal':
    'New-journey student who has not seen the welcome modal yet.',
  'onboarding-welcome-seen':
    'New-journey student who already dismissed the welcome modal.',
  'onboarding-fees-unpaid':
    'LMS Walkthrough test bed (videos + auto-next + profile photo + download app) with payment countdown; program tab locked.',
  'onboarding-fees-unpaid-with-app-download':
    'Same as fees-unpaid, but download-app is pre-completed via a seeded device token.',
  'onboarding-fees-paid':
    'Full fees paid — Program Onboarding tab unlocked. Documents + Student Kit driven by a simulated onward response (see flags); agreement pending; ID card unlock unchanged.',
  'onboarding-complete': 'All onboarding steps complete — ID card unlocked.',
  'onboarding-fees-overdue': 'Course fee deadline passed without full payment.',
}

export const ONBOARDING_FLOW_IDS = Object.keys(
  ONBOARDING_FLOW_DESCRIPTIONS,
) as Array<OnboardingFlowId>

function buildSeedCommand(flowId: OnboardingFlowId): string {
  if (flowId === 'onboarding-fees-unpaid') {
    return `npm run seed ${flowId}\n# Optional (pre-complete download-app by seeding a user_device_tokens row):\nnpm run seed ${flowId} -- --with-app-download`
  }

  if (flowId === 'onboarding-fees-paid') {
    return [
      `npm run seed ${flowId}`,
      '# Default: agreement pending, docs + kit visible but incomplete',
      '# Agreement pending (default — no extra flags needed)',
      '# Kit filled, no tracking:',
      `npm run seed ${flowId} -- --agreement-signed --kit-shown --kit-filled`,
      '# Kit with tracking URL:',
      `npm run seed ${flowId} -- --agreement-signed --kit-shown --kit-filled --kit-tracking`,
      '# Documents uploaded:',
      `npm run seed ${flowId} -- --agreement-signed --docs-required --docs-uploaded`,
      '# Serve the simulated documents endpoint (point ADMISSIONS_API_BASE_URL at it):',
      'npx tsx seed/onward-simulation/onwardMockServer.ts',
    ].join('\n')
  }

  return `npm run seed ${flowId}`
}

export function createOnboardingFlowMeta(
  flowId: OnboardingFlowId,
): SeedFlowMeta {
  const seedCommand = buildSeedCommand(flowId)

  return {
    id: flowId,
    description: ONBOARDING_FLOW_DESCRIPTIONS[flowId],
    timing: {},
    seedCommand,
    defaultCredentialEmails: [
      { role: 'admin', email: flowScopedEmail(flowId, 'admin') },
      { role: 'student', email: flowScopedEmail(flowId, 'student') },
    ],
    primaryLoginRole: 'student',
  }
}
