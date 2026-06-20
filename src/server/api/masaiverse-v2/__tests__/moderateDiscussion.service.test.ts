import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))
vi.mock('@/db/schema', () => ({
  posts: { id: 'posts.id', meta: 'posts.meta' },
}))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

/** Captures the `.set()` payload of a `db.update(...).set(...).where(...)` call. */
function updateChain(captured: Array<unknown>) {
  return {
    set: (value: unknown) => {
      captured.push(value)
      return { where: () => Promise.resolve() }
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setPostBanned', () => {
  it('rejects a non-admin with a 403 and never writes', async () => {
    const { setPostBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })

    await expect(setPostBanned(1, 7, true)).rejects.toMatchObject({
      status: 403,
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('bans a post, stamping banned_by and banned_date', async () => {
    const { setPostBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ id: 7 }]))
    const captured: Array<unknown> = []
    hoisted.dbUpdate.mockReturnValueOnce(updateChain(captured))

    await expect(setPostBanned(99, 7, true)).resolves.toEqual({
      target: 'post',
      postId: '7',
      replyId: null,
      isBanned: true,
    })
    expect(captured[0]).toMatchObject({ isBanned: 1, bannedBy: 99 })
    expect((captured[0] as { bannedDate: unknown }).bannedDate).toBeTruthy()
  })

  it('unbans a post, clearing banned_by and banned_date', async () => {
    const { setPostBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ id: 7 }]))
    const captured: Array<unknown> = []
    hoisted.dbUpdate.mockReturnValueOnce(updateChain(captured))

    await expect(setPostBanned(99, 7, false)).resolves.toMatchObject({
      isBanned: false,
    })
    expect(captured[0]).toEqual({
      isBanned: 0,
      bannedBy: null,
      bannedDate: null,
    })
  })

  it('404s when the post does not exist', async () => {
    const { setPostBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(setPostBanned(99, 7, true)).rejects.toMatchObject({
      status: 404,
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })
})

describe('setReplyBanned', () => {
  it('rejects a non-admin with a 403', async () => {
    const { setReplyBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })

    await expect(setReplyBanned(1, 7, 3, true)).rejects.toMatchObject({
      status: 403,
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('adds the reply id to the post meta (de-duplicated)', async () => {
    const { setReplyBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ meta: { foo: 'bar', bannedReplyIds: [3] } }]),
    )
    const captured: Array<unknown> = []
    hoisted.dbUpdate.mockReturnValueOnce(updateChain(captured))

    await expect(setReplyBanned(99, 7, 4, true)).resolves.toEqual({
      target: 'reply',
      postId: '7',
      replyId: '4',
      isBanned: true,
    })
    // Existing meta keys are preserved; ids stay unique.
    expect(captured[0]).toEqual({
      meta: { foo: 'bar', bannedReplyIds: [3, 4] },
    })
  })

  it('removes the reply id from the post meta on unban', async () => {
    const { setReplyBanned } =
      await import('../services/moderateDiscussion.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ meta: { bannedReplyIds: [3, 4] } }]),
    )
    const captured: Array<unknown> = []
    hoisted.dbUpdate.mockReturnValueOnce(updateChain(captured))

    await expect(setReplyBanned(99, 7, 4, false)).resolves.toMatchObject({
      isBanned: false,
    })
    expect(captured[0]).toEqual({ meta: { bannedReplyIds: [3] } })
  })
})
