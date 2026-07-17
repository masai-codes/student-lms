import { runOnboardingFlow } from '../onboarding-shared/runOnboardingFlow'

export async function seedOnboardingWelcomeSeen() {
  return runOnboardingFlow('onboarding-welcome-seen')
}
