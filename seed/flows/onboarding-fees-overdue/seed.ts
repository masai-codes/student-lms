import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingFeesOverdue() {
  return runOnboardingFlow('onboarding-fees-overdue')
}
