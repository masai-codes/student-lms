import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingComplete() {
  return runOnboardingFlow('onboarding-complete')
}
