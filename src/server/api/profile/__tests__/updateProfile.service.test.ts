import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfile } from '@/server/api/profile/updateProfile.service'

const select = vi.hoisted(() => vi.fn())
const set = vi.hoisted(() => vi.fn())
const values = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: (...args: Array<unknown>) => select(...args),
    update: () => ({ set: (...args: Array<unknown>) => set(...args) }),
    insert: () => ({ values: (...args: Array<unknown>) => values(...args) }),
  },
}))

/**
 * Each `select(...)` resolves to the next queued row-set, so a single test can
 * script the profile lookup, the user re-read and the profile re-read in order.
 */
function queueRows(...rowSets: Array<Array<Record<string, unknown>>>) {
  let call = 0
  select.mockImplementation(() => {
    const rows = rowSets[call] ?? []
    call += 1
    return {
      from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
    }
  })
}

const writes = () => set.mock.calls.map((call) => call[0])

beforeEach(() => {
  vi.clearAllMocks()
  set.mockReturnValue({ where: () => Promise.resolve(undefined) })
  values.mockReturnValue(Promise.resolve(undefined))
})

describe('updateProfile', () => {
  it('trims and stores a new name', async () => {
    queueRows([{ name: 'Riya Sharma' }], [{ secondaryMobile: null }])

    await expect(
      updateProfile(7, { name: '  Riya Sharma  ' }),
    ).resolves.toEqual({ name: 'Riya Sharma', phone: null })

    expect(writes()).toContainEqual({ name: 'Riya Sharma' })
  })

  it('normalises a formatted phone number to digits', async () => {
    queueRows(
      [{ id: 3 }],
      [{ name: 'Riya' }],
      [{ secondaryMobile: '9876543210' }],
    )

    await expect(
      updateProfile(7, { secondaryMobile: '98765-43210' }),
    ).resolves.toEqual({ name: 'Riya', phone: '9876543210' })

    expect(writes()).toContainEqual({ secondaryMobile: '9876543210' })
  })

  it('creates a profile row for a student who has none', async () => {
    queueRows([], [{ name: 'Riya' }], [])

    await updateProfile(7, { secondaryMobile: '9876543210' })

    expect(values).toHaveBeenCalledWith({
      userId: 7,
      secondaryMobile: '9876543210',
    })
  })

  it('rejects a request with nothing to change', async () => {
    await expect(updateProfile(7, {})).rejects.toMatchObject({
      status: 400,
      code: 'NO_PROFILE_FIELDS_TO_UPDATE',
    })
    expect(set).not.toHaveBeenCalled()
  })

  it('rejects a blank or over-long name', async () => {
    await expect(updateProfile(7, { name: '   ' })).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_NAME',
    })
    await expect(
      updateProfile(7, { name: 'x'.repeat(256) }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_NAME' })
    expect(set).not.toHaveBeenCalled()
  })

  it('rejects an invalid phone number before touching the database', async () => {
    await expect(
      updateProfile(7, { secondaryMobile: '98765' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_MOBILE' })
    expect(set).not.toHaveBeenCalled()
  })

  it('404s when the user disappears mid-update', async () => {
    // Name-only update: the first select is the post-write user re-read.
    queueRows([], [])
    await expect(updateProfile(7, { name: 'Riya' })).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    })
  })

  it('reports a blank stored phone number as null', async () => {
    queueRows([{ name: 'Riya' }], [{ secondaryMobile: '   ' }])
    await expect(updateProfile(7, { name: 'Riya' })).resolves.toEqual({
      name: 'Riya',
      phone: null,
    })
  })

  it('updates both fields in one call', async () => {
    queueRows(
      [{ id: 3 }],
      [{ name: 'Riya' }],
      [{ secondaryMobile: '9876543210' }],
    )

    await updateProfile(7, { name: 'Riya', secondaryMobile: '9876543210' })

    expect(writes()).toContainEqual({ name: 'Riya' })
    expect(writes()).toContainEqual({ secondaryMobile: '9876543210' })
  })
})
