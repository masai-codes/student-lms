import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

import { getFlow, listFlows } from './registry'

describe('seed registry', () => {
  it('lists login-and-join-lecture flow', () => {
    const flows = listFlows()
    expect(flows.some((flow) => flow.id === 'login-and-join-lecture')).toBe(true)
  })

  it('returns flow module by id', async () => {
    const flow = await getFlow('login-and-join-lecture')
    expect(flow.meta.seedCommand).toBe('npm run seed login-and-join-lecture')
  })

  it('throws for unknown flow id', async () => {
    await expect(getFlow('does-not-exist')).rejects.toThrow(/Unknown seed flow/)
  })
})
