import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('../services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))
vi.mock('@/db/schema', () => ({
  users: {
    id: 'users.id',
    name: 'users.name',
    email: 'users.email',
    profilePhotoPath: 'users.photo',
  },
}))

/** select().from().where().limit() */
const searchChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getAdminModeState.mockResolvedValue({ isAdmin: true, enabled: true })
})

async function load() {
  return (await import('../services/searchUsers.service')).searchUsers
}

describe('searchUsers', () => {
  it('rejects a non-admin with 403', async () => {
    const searchUsers = await load()
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })
    await expect(searchUsers(1, 'priya')).rejects.toMatchObject({ status: 403 })
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns an empty list for short/blank queries without querying', async () => {
    const searchUsers = await load()
    await expect(searchUsers(1, ' a ')).resolves.toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('maps matched users, coercing ids and null photos', async () => {
    const searchUsers = await load()
    hoisted.dbSelect.mockReturnValueOnce(
      searchChain([
        { id: 10, name: 'Priya', email: 'priya@x.com', avatarUrl: 'p.jpg' },
        { id: 20, name: 'Pritam', email: 'pritam@x.com', avatarUrl: null },
      ]),
    )

    await expect(searchUsers(1, 'pri')).resolves.toEqual([
      { id: '10', name: 'Priya', email: 'priya@x.com', avatarUrl: 'p.jpg' },
      { id: '20', name: 'Pritam', email: 'pritam@x.com', avatarUrl: null },
    ])
  })
})
