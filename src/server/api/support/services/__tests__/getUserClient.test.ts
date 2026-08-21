import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

function stubSelect(rows: Array<Record<string, any>>) {
  hoisted.dbSelect.mockReturnValue({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

describe('getUserClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the stored client value', async () => {
    stubSelect([{ client: 'iitj' }])
    const { getUserClient } = await import('../directory.service')

    await expect(getUserClient(1)).resolves.toBe('iitj')
  })

  it('defaults to masai when the user row is missing', async () => {
    stubSelect([])
    const { getUserClient } = await import('../directory.service')

    await expect(getUserClient(404)).resolves.toBe('masai')
  })
})
