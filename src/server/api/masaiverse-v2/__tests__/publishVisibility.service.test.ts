import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ getAdminModeState: vi.fn() }))

vi.mock('@/db/schema', () => ({
  events: { meta: 'events.meta' },
  clubs: { meta: 'clubs.meta' },
}))

vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('canSeeUnpublished', () => {
  it('returns false without consulting admin state for a null user', async () => {
    const { canSeeUnpublished } = await import('../services/publishVisibility')
    await expect(canSeeUnpublished(null)).resolves.toBe(false)
    await expect(canSeeUnpublished(undefined)).resolves.toBe(false)
    expect(hoisted.getAdminModeState).not.toHaveBeenCalled()
  })

  it('is true only for an admin with admin mode enabled', async () => {
    const { canSeeUnpublished } = await import('../services/publishVisibility')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    await expect(canSeeUnpublished(1)).resolves.toBe(true)
  })

  it('is false for an admin with admin mode disabled', async () => {
    const { canSeeUnpublished } = await import('../services/publishVisibility')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: false })
    await expect(canSeeUnpublished(1)).resolves.toBe(false)
  })

  it('is false for a non-admin', async () => {
    const { canSeeUnpublished } = await import('../services/publishVisibility')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })
    await expect(canSeeUnpublished(1)).resolves.toBe(false)
  })
})

describe('publishedEventCondition / publishedClubCondition', () => {
  it('returns no condition when the viewer may see drafts', async () => {
    const { publishedEventCondition, publishedClubCondition } = await import(
      '../services/publishVisibility'
    )
    expect(publishedEventCondition(true)).toBeUndefined()
    expect(publishedClubCondition(true)).toBeUndefined()
  })

  it('returns a SQL filter when the viewer may not see drafts', async () => {
    const { publishedEventCondition, publishedClubCondition } = await import(
      '../services/publishVisibility'
    )
    expect(publishedEventCondition(false)).toBeDefined()
    expect(publishedClubCondition(false)).toBeDefined()
  })
})
