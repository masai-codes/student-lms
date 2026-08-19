import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getEmailPreferences,
  parsePreferencePatch,
  updateEmailPreferences,
} from '@/server/api/profile/emailPreferences.service'

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

/** Makes the profile lookup resolve to one row, or none when `row` is null. */
function withProfileRow(row: Record<string, unknown> | null) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(row ? [row] : []) }),
    }),
  })
}

const writtenMeta = () =>
  (set.mock.calls[0]?.[0]?.meta ?? values.mock.calls[0]?.[0]?.meta) as
    | Record<string, unknown>
    | undefined

beforeEach(() => {
  vi.clearAllMocks()
  set.mockReturnValue({ where: () => Promise.resolve(undefined) })
  values.mockReturnValue(Promise.resolve(undefined))
})

const ALL_ON = {
  lectures: true,
  assignments: true,
  evaluations: true,
  announcements: true,
  tickets: true,
  discussions: true,
}

describe('parsePreferencePatch', () => {
  it('keeps only the six known boolean keys', () => {
    expect(
      parsePreferencePatch({
        lectures: false,
        messages: false,
        nonsense: true,
        tickets: 'yes',
      }),
    ).toEqual({ lectures: false })
  })

  it('returns an empty patch for non-objects', () => {
    expect(parsePreferencePatch(null)).toEqual({})
    expect(parsePreferencePatch('lectures')).toEqual({})
  })
})

describe('getEmailPreferences', () => {
  it('defaults everything to on when there is no profile row', async () => {
    withProfileRow(null)
    await expect(getEmailPreferences(7)).resolves.toEqual(ALL_ON)
  })

  it('defaults everything to on when meta holds no preferences', async () => {
    withProfileRow({ meta: { profile_pic: 'a.png' } })
    await expect(getEmailPreferences(7)).resolves.toEqual(ALL_ON)
  })

  it('ignores a non-object email_notifications value', async () => {
    withProfileRow({ meta: { email_notifications: 'nope' } })
    await expect(getEmailPreferences(7)).resolves.toEqual(ALL_ON)
  })

  it('reads stored booleans and ignores stored junk', async () => {
    withProfileRow({
      meta: { email_notifications: { lectures: false, tickets: 'maybe' } },
    })
    await expect(getEmailPreferences(7)).resolves.toEqual({
      ...ALL_ON,
      lectures: false,
    })
  })

  it('tolerates a null meta', async () => {
    withProfileRow({ meta: null })
    await expect(getEmailPreferences(7)).resolves.toEqual(ALL_ON)
  })
})

describe('updateEmailPreferences', () => {
  it('rejects an empty patch', async () => {
    withProfileRow({ id: 3, meta: {} })
    await expect(updateEmailPreferences(7, {})).rejects.toMatchObject({
      status: 400,
      code: 'NO_PREFERENCES_TO_UPDATE',
    })
  })

  it('preserves other meta keys and unrelated notification flags', async () => {
    withProfileRow({
      id: 3,
      meta: {
        profile_pic: 'a.png',
        email_notifications: { messages: false, lectures: true },
      },
    })

    await updateEmailPreferences(7, { lectures: false })

    expect(writtenMeta()).toEqual({
      profile_pic: 'a.png',
      email_notifications: { messages: false, lectures: false },
    })
  })

  it('returns the merged preferences', async () => {
    withProfileRow({ id: 3, meta: {} })
    await expect(
      updateEmailPreferences(7, { discussions: false }),
    ).resolves.toEqual({ ...ALL_ON, discussions: false })
  })

  it('creates the profile row when the student has none', async () => {
    withProfileRow(null)
    await updateEmailPreferences(7, { tickets: false })

    expect(values).toHaveBeenCalledTimes(1)
    expect(set).not.toHaveBeenCalled()
    expect(values.mock.calls[0][0]).toMatchObject({ userId: 7 })
    expect(writtenMeta()).toEqual({ email_notifications: { tickets: false } })
  })

  it('replaces a non-object stored notifications blob', async () => {
    withProfileRow({ id: 3, meta: { email_notifications: 'corrupt' } })
    await updateEmailPreferences(7, { tickets: false })
    expect(writtenMeta()).toEqual({ email_notifications: { tickets: false } })
  })
})
