import { describe, expect, it } from 'vitest'

import { getOnboardingScenario, ONBOARDING_SCENARIOS } from './scenarios'

describe('onboarding scenarios', () => {
  it('defines a scenario for every onboarding flow id', () => {
    expect(Object.keys(ONBOARDING_SCENARIOS)).toHaveLength(10)
  })

  it('legacy user skips admission data', () => {
    expect(getOnboardingScenario('onboarding-legacy-user').includeAdmission).toBe(false)
  })

  it('welcome modal keeps showWelcomeModal unset', () => {
    expect(getOnboardingScenario('onboarding-welcome-modal').userMeta).toEqual({})
  })

  it('fees-paid unlocks program onboarding via admission data', () => {
    const scenario = getOnboardingScenario('onboarding-fees-paid')
    expect(scenario.admission?.fullFeesPaid).toBe(1)
  })

  it('complete scenario fast-forwards progress', () => {
    const scenario = getOnboardingScenario('onboarding-complete')
    expect(scenario.deviceToken).toBe(true)
    expect(scenario.videoAttendances).toBe('all')
    expect(scenario.admission?.idCardUrl).toMatch(/^https:\/\//)
  })
})
