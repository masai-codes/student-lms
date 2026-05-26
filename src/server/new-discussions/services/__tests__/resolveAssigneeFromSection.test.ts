import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
  },
}))

describe('resolveAssigneeFromSection', () => {
  beforeEach(() => {
    hoisted.dbSelect.mockReset()
  })

  it('returns fallback when sectionId is null', async () => {
    const { resolveAssigneeFromSection } = await import(
      '@/server/new-discussions/services/resolveAssigneeFromSection'
    )
    await expect(resolveAssigneeFromSection(10, null, 99)).resolves.toBe(99)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns manager id when row exists', async () => {
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                managerId: 77,
              },
            ]),
        }),
      }),
    })

    const { resolveAssigneeFromSection } = await import(
      '@/server/new-discussions/services/resolveAssigneeFromSection'
    )
    await expect(resolveAssigneeFromSection(10, 5, 99)).resolves.toBe(77)
  })

  it('returns fallback when manager missing', async () => {
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                managerId: null,
              },
            ]),
        }),
      }),
    })

    const { resolveAssigneeFromSection } = await import(
      '@/server/new-discussions/services/resolveAssigneeFromSection'
    )
    await expect(resolveAssigneeFromSection(10, 5, 99)).resolves.toBe(99)
  })
})
