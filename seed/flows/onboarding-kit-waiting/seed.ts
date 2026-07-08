import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingKitWaiting() {
  return runOnboardingFlow('onboarding-kit-waiting')
}
