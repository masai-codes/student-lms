import { describe, expect, it } from 'vitest'

import { getOnboardingScenario, ONBOARDING_SCENARIOS } from './scenarios'

describe('onboarding flow registry metadata', () => {
  it.each(Object.keys(ONBOARDING_SCENARIOS))('has a scenario preset for %s', (flowId) => {
    const scenario = getOnboardingScenario(flowId as keyof typeof ONBOARDING_SCENARIOS)
    expect(scenario).toBeDefined()
  })
})
