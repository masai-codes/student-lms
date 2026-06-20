import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  users: { id: 'users.id', role: 'users.role', meta: 'users.meta' },
}))

vi.mock('@/server/auth/v2/portalGate', () => ({
  isAdminRole: (role: string | null) =>
    role === 'admin' || role === 'super_admin',
}))

/** `db.select().from().where().limit()` */
function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAdminModeState', () => {
  it('returns not-admin/disabled when the user is missing', async () => {
    const { getAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(getAdminModeState(1)).resolves.toEqual({
      isAdmin: false,
      enabled: false,
    })
  })

  it('returns not-admin/disabled for a student role', async () => {
    const { getAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { role: 'student', meta: { isMasaiverseAdminModeEnabled: true } },
      ]),
    )

    await expect(getAdminModeState(1)).resolves.toEqual({
      isAdmin: false,
      enabled: false,
    })
  })

  it('returns enabled:true for an admin who has switched it on', async () => {
    const { getAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { role: 'admin', meta: { isMasaiverseAdminModeEnabled: true } },
      ]),
    )

    await expect(getAdminModeState(1)).resolves.toEqual({
      isAdmin: true,
      enabled: true,
    })
  })

  it('defaults enabled:false for an admin with null/empty meta', async () => {
    const { getAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ role: 'super_admin', meta: null }]),
    )

    await expect(getAdminModeState(1)).resolves.toEqual({
      isAdmin: true,
      enabled: false,
    })
  })
})

describe('setAdminModeState', () => {
  it('rejects a missing user with a 403', async () => {
    const { setAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(setAdminModeState(1, true)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('rejects a non-admin with a 403', async () => {
    const { setAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ role: 'student', meta: {} }]),
    )

    await expect(setAdminModeState(1, true)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('enables admin mode, preserving sibling meta keys', async () => {
    const { setAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          role: 'admin',
          meta: { profile_pic: 'x.png', isMasaiverseVisitedOnce: true },
        },
      ]),
    )
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockReturnValue({ where })
    hoisted.dbUpdate.mockReturnValue({ set })

    await expect(setAdminModeState(7, true)).resolves.toEqual({
      isAdmin: true,
      enabled: true,
    })
    expect(set).toHaveBeenCalledWith({
      meta: {
        profile_pic: 'x.png',
        isMasaiverseVisitedOnce: true,
        isMasaiverseAdminModeEnabled: true,
      },
    })
  })

  it('disables admin mode for an admin with null meta', async () => {
    const { setAdminModeState } = await import('../services/adminMode.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ role: 'admin', meta: null }]),
    )
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockReturnValue({ where })
    hoisted.dbUpdate.mockReturnValue({ set })

    await expect(setAdminModeState(7, false)).resolves.toEqual({
      isAdmin: true,
      enabled: false,
    })
    expect(set).toHaveBeenCalledWith({
      meta: { isMasaiverseAdminModeEnabled: false },
    })
  })
})
