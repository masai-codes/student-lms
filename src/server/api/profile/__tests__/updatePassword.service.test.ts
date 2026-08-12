import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updatePassword } from '@/server/api/profile/updatePassword.service'

const select = vi.hoisted(() => vi.fn())
const set = vi.hoisted(() => vi.fn())
const compare = vi.hoisted(() => vi.fn())
const hash = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: (...args: Array<unknown>) => select(...args),
    update: () => ({ set: (...args: Array<unknown>) => set(...args) }),
  },
}))

vi.mock('bcryptjs', () => ({
  compare: (...args: Array<unknown>) => compare(...args),
  hash: (...args: Array<unknown>) => hash(...args),
}))

function withUser(row: Record<string, unknown> | null) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(row ? [row] : []) }),
    }),
  })
}

const VALID = { currentPassword: 'old-secret', newPassword: 'brandnewpass' }

beforeEach(() => {
  vi.clearAllMocks()
  set.mockReturnValue({ where: () => Promise.resolve(undefined) })
  hash.mockResolvedValue('$2a$hashed')
})

describe('updatePassword', () => {
  it('verifies the current password and stores a new hash', async () => {
    withUser({ password: '$2a$old' })
    // First call verifies the current password; second checks it actually changed.
    compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    await expect(updatePassword(7, VALID)).resolves.toBeUndefined()

    expect(compare).toHaveBeenNthCalledWith(1, 'old-secret', '$2a$old')
    expect(hash).toHaveBeenCalledWith('brandnewpass', 10)
    expect(set).toHaveBeenCalledWith({ password: '$2a$hashed' })
  })

  it('requires a current password', async () => {
    await expect(
      updatePassword(7, { ...VALID, currentPassword: '' }),
    ).rejects.toMatchObject({ status: 400, code: 'CURRENT_PASSWORD_REQUIRED' })
    expect(set).not.toHaveBeenCalled()
  })

  it('rejects a password that breaks the rules', async () => {
    await expect(
      updatePassword(7, { ...VALID, newPassword: 'short' }),
    ).rejects.toMatchObject({ status: 400, code: 'WEAK_PASSWORD' })

    await expect(
      updatePassword(7, { ...VALID, newPassword: 'has a space' }),
    ).rejects.toMatchObject({ status: 400, code: 'WEAK_PASSWORD' })

    expect(set).not.toHaveBeenCalled()
  })

  it('404s for a missing user', async () => {
    withUser(null)
    await expect(updatePassword(7, VALID)).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    })
  })

  it('rejects a wrong current password without writing', async () => {
    withUser({ password: '$2a$old' })
    compare.mockResolvedValue(false)

    await expect(updatePassword(7, VALID)).rejects.toMatchObject({
      status: 400,
      code: 'INCORRECT_CURRENT_PASSWORD',
    })
    expect(set).not.toHaveBeenCalled()
  })

  it('refuses to re-set the same password', async () => {
    withUser({ password: '$2a$old' })
    compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true)

    await expect(updatePassword(7, VALID)).rejects.toMatchObject({
      status: 400,
      code: 'PASSWORD_UNCHANGED',
    })
    expect(set).not.toHaveBeenCalled()
  })
})
