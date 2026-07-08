import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingAgreementPending() {
  return runOnboardingFlow('onboarding-agreement-pending')
}
