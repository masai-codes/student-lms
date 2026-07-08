import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

import { getFlow, listFlows } from './registry'
import { ONBOARDING_FLOW_IDS } from './flows/onboarding-shared/flowMeta'

describe('seed registry', () => {
  it('lists login-and-join-lecture flow', () => {
    const flows = listFlows()
    expect(flows.some((flow) => flow.id === 'login-and-join-lecture')).toBe(true)
    expect(flows.some((flow) => flow.id === 'dashboard-home')).toBe(true)
  })

  it('lists all onboarding flows', () => {
    const flows = listFlows()
    for (const id of ONBOARDING_FLOW_IDS) {
      expect(flows.some((flow) => flow.id === id)).toBe(true)
    }
  })

  it('returns flow module by id', async () => {
    const flow = await getFlow('login-and-join-lecture')
    expect(flow.meta.seedCommand).toBe('npm run seed login-and-join-lecture')
  })

  it('returns onboarding flow module by id', async () => {
    const flow = await getFlow('onboarding-welcome-modal')
    expect(flow.meta.primaryLoginRole).toBe('student')
    expect(flow.meta.defaultCredentialEmails?.[1]?.email).toBe(
      'onboarding-welcome-modal.student@example.com',
    )
  })

  it('returns dashboard-home flow module by id', async () => {
    const flow = await getFlow('dashboard-home')
    expect(flow.meta.id).toBe('dashboard-home')
    expect(flow.meta.defaultCredentialEmails?.[1]?.email).toBe(
      'dashboard-home.student@example.com',
    )
  })

  it('throws for unknown flow id', async () => {
    await expect(getFlow('does-not-exist')).rejects.toThrow(/Unknown seed flow/)
  })
})
