import { describe, expect, it } from 'vitest'

import { getOnboardingScenario, ONBOARDING_SCENARIOS } from './scenarios'
import { ONBOARDING_PROFILE_PHOTO_URL } from './constants'

describe('onboarding scenarios', () => {
  it('defines a scenario for every onboarding flow id', () => {
    expect(Object.keys(ONBOARDING_SCENARIOS)).toHaveLength(7)
  })

  it('legacy user skips admission data', () => {
    expect(
      getOnboardingScenario('onboarding-legacy-user').includeAdmission,
    ).toBe(false)
  })

  it('welcome modal keeps showWelcomeModal unset', () => {
    expect(getOnboardingScenario('onboarding-welcome-modal').userMeta).toEqual(
      {},
    )
  })

  it('fees-unpaid is an interactive LMS Walkthrough start state', () => {
    const scenario = getOnboardingScenario('onboarding-fees-unpaid')
    expect(scenario.admission?.fullFeesPaid).toBe(0)
    expect(scenario.userMeta).toEqual({ showWelcomeModal: true })
    expect(scenario.videoAttendances).toBe('none')
    expect(scenario.deviceToken).toBeUndefined()
  })

  it('fees-paid unlocks program onboarding via admission data', () => {
    const scenario = getOnboardingScenario('onboarding-fees-paid')
    expect(scenario.admission?.fullFeesPaid).toBe(1)
  })

  it('fees-paid documents + kit start incomplete via the simulated onward shape', () => {
    const scenario = getOnboardingScenario('onboarding-fees-paid')
    expect(scenario.agreementSigned).toBe(false)
    expect(scenario.simulatedOnward).toEqual({
      documentsRequired: true,
      documentsUploaded: false,
      kitShowKit: true,
      kitDetailsFilled: false,
      kitTrackingUrl: null,
    })
  })

  it('complete scenario fast-forwards progress', () => {
    const scenario = getOnboardingScenario('onboarding-complete')
    expect(scenario.deviceToken).toBe(true)
    expect(scenario.videoAttendances).toBe('all')
    expect(scenario.profile?.meta).toEqual({
      profile_pic: ONBOARDING_PROFILE_PHOTO_URL,
    })
    expect(scenario.admission?.idCardUrl).toMatch(/^https:\/\//)
  })
})
