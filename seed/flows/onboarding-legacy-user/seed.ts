import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingLegacyUser() {
  return runOnboardingFlow('onboarding-legacy-user')
}
