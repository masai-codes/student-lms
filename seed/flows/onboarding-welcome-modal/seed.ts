import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingWelcomeModal() {
  return runOnboardingFlow('onboarding-welcome-modal')
}
