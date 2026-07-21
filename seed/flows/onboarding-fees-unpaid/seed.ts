import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingFeesUnpaid() {
  return runOnboardingFlow('onboarding-fees-unpaid')
}
