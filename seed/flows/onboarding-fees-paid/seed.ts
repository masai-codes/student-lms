import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingFeesPaid() {
  return runOnboardingFlow('onboarding-fees-paid')
}
