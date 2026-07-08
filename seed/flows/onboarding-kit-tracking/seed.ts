import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingKitTracking() {
  return runOnboardingFlow('onboarding-kit-tracking')
}
