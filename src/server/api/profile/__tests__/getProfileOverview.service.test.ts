import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfileOverview } from '@/server/api/profile/getProfileOverview.service'

const select = vi.hoisted(() => vi.fn())
const getStudentCodesForUser = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: { select: (...args: Array<unknown>) => select(...args) },
}))

vi.mock('@/server/users/getStudentCode', () => ({
  getStudentCodesForUser: (...args: Array<unknown>) =>
    getStudentCodesForUser(...args),
}))

/** Queues row-sets in call order; supports both `where()` and `where().limit()`. */
function queueRows(...rowSets: Array<Array<Record<string, unknown>>>) {
  let call = 0
  select.mockImplementation(() => {
    const rows = rowSets[call] ?? []
    call += 1
    const terminal = Object.assign(Promise.resolve(rows), {
      limit: () => Promise.resolve(rows),
    })
    return { from: () => ({ where: () => terminal }) }
  })
}

const USER = {
  name: 'Riya Sharma',
  email: 'riya@example.com',
  username: 'STALE_CODE',
  profilePhotoPath: 'https://cdn.example/user.png',
}

beforeEach(() => {
  vi.clearAllMocks()
  getStudentCodesForUser.mockResolvedValue([])
})

describe('getProfileOverview', () => {
  it('404s for a missing user', async () => {
    queueRows([])
    await expect(getProfileOverview(7)).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    })
  })

  it('prefers profiles.meta.profile_pic over users.profile_photo_path', async () => {
    queueRows(
      [USER],
      [
        {
          meta: { profile_pic: 'https://cdn.example/meta.png' },
          secondaryMobile: null,
        },
      ],
      [],
    )
    const profile = await getProfileOverview(7)
    expect(profile.avatarUrl).toBe('https://cdn.example/meta.png')
  })

  it('falls back to users.profile_photo_path, then to null', async () => {
    queueRows([USER], [{ meta: {}, secondaryMobile: null }], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      avatarUrl: 'https://cdn.example/user.png',
    })

    queueRows([{ ...USER, profilePhotoPath: null }], [], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      avatarUrl: null,
    })
  })

  it('ignores a blank or non-string profile_pic', async () => {
    queueRows(
      [USER],
      [{ meta: { profile_pic: '  ' }, secondaryMobile: null }],
      [],
    )
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      avatarUrl: 'https://cdn.example/user.png',
    })
  })

  it('works for a student with no profiles row', async () => {
    queueRows([USER], [], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      name: 'Riya Sharma',
      email: 'riya@example.com',
      phone: null,
    })
  })

  it('reports a blank stored phone as null', async () => {
    queueRows([USER], [{ meta: null, secondaryMobile: '   ' }], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({ phone: null })
  })

  it('decorates each student code with its batch name', async () => {
    getStudentCodesForUser.mockResolvedValue([
      { code: 'SDE_1', batchId: 900 },
      { code: 'DS_2', batchId: 901 },
    ])
    queueRows(
      [USER],
      [{ meta: null, secondaryMobile: null }],
      [],
      [
        { id: 900, name: 'SDE Batch 42' },
        { id: 901, name: 'DS Batch 7' },
      ],
    )

    await expect(getProfileOverview(7)).resolves.toMatchObject({
      studentCodes: [
        { code: 'SDE_1', batchId: 900, batchName: 'SDE Batch 42' },
        { code: 'DS_2', batchId: 901, batchName: 'DS Batch 7' },
      ],
    })
  })

  it('leaves the batch name null when the batch row is missing', async () => {
    getStudentCodesForUser.mockResolvedValue([{ code: 'SDE_1', batchId: 900 }])
    queueRows([USER], [{ meta: null, secondaryMobile: null }], [], [])
    const profile = await getProfileOverview(7)
    expect(profile.studentCodes).toEqual([
      { code: 'SDE_1', batchId: 900, batchName: null },
    ])
  })

  it('falls back to users.username only when batch_user has no code', async () => {
    queueRows([USER], [{ meta: null, secondaryMobile: null }], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      studentCodes: [{ code: 'STALE_CODE', batchId: null, batchName: null }],
    })
  })

  it('returns no codes when there is no code anywhere', async () => {
    queueRows([{ ...USER, username: null }], [], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      studentCodes: [],
    })
  })

  it('derives the admission flags from user_batch_admission_data', async () => {
    queueRows([USER], [{ meta: null, secondaryMobile: null }], [])
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      isNewUserJourney: false,
      hasFullFees: false,
    })

    queueRows(
      [USER],
      [{ meta: null, secondaryMobile: null }],
      [{ fullFeesPaid: 0 }],
    )
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      isNewUserJourney: true,
      hasFullFees: false,
    })

    queueRows(
      [USER],
      [{ meta: null, secondaryMobile: null }],
      [{ fullFeesPaid: 0 }, { fullFeesPaid: 1 }],
    )
    await expect(getProfileOverview(7)).resolves.toMatchObject({
      isNewUserJourney: true,
      hasFullFees: true,
    })
  })
})
