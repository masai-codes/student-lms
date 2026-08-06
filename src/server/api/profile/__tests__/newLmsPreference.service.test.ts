import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getNewLmsPagesPreference,
  markTryNewTourSeen,
  updateNewLmsPagesPreference,
} from '@/server/api/profile/newLmsPreference.service'

const select = vi.hoisted(() => vi.fn())
const set = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: (...args: Array<unknown>) => select(...args),
    update: () => ({ set: (...args: Array<unknown>) => set(...args) }),
  },
}))

/** Makes `db.select(...)` resolve to a single row holding `meta`. */
function withMeta(meta: unknown) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve([{ meta }]) }),
    }),
  })
}

/** The meta object written by the update, or undefined if nothing was written. */
function writtenMeta() {
  return set.mock.calls[0]?.[0]?.meta as Record<string, unknown> | undefined
}

beforeEach(() => {
  vi.clearAllMocks()
  set.mockReturnValue({ where: () => Promise.resolve(undefined) })
})

describe('getNewLmsPagesPreference', () => {
  it('reads the flag off users.meta', async () => {
    withMeta({ new_lms_pages_enabled: true })
    await expect(getNewLmsPagesPreference(7)).resolves.toBe(true)
  })

  it('defaults to false when the key (or the whole meta) is absent', async () => {
    withMeta(null)
    await expect(getNewLmsPagesPreference(7)).resolves.toBe(false)
  })
})

describe('updateNewLmsPagesPreference', () => {
  it('sets the flag while preserving other meta keys', async () => {
    withMeta({ profile_pic: 'a.png' })

    await expect(updateNewLmsPagesPreference(7, true)).resolves.toBe(true)
    expect(writtenMeta()).toMatchObject({
      profile_pic: 'a.png',
      new_lms_pages_enabled: true,
    })
  })

  it('appends a feedback entry on an ON → OFF switch-back', async () => {
    withMeta({ new_lms_pages_enabled: true })

    await updateNewLmsPagesPreference(7, false, '  too slow  ')

    const feedback = writtenMeta()?.new_lms_switch_feedback as Array<{
      feedback: string
    }>
    expect(feedback).toHaveLength(1)
    expect(feedback[0].feedback).toBe('too slow')
  })

  it('does not record feedback when the flag was already off', async () => {
    withMeta({})

    await updateNewLmsPagesPreference(7, false, 'ignored')

    expect(writtenMeta()).not.toHaveProperty('new_lms_switch_feedback')
  })

  it('is a no-op for a hide_switch_option user, returning their current value', async () => {
    withMeta({ hide_switch_option: true, new_lms_pages_enabled: true })

    // iitj students have no switch CTA in either LMS, so a call here is a
    // hand-crafted request and must not move them off the new LMS.
    await expect(updateNewLmsPagesPreference(7, false)).resolves.toBe(true)
    expect(set).not.toHaveBeenCalled()
  })
})

describe('markTryNewTourSeen', () => {
  it('sets the seen flag while preserving other meta keys', async () => {
    withMeta({ new_lms_pages_enabled: true })

    await expect(markTryNewTourSeen(7)).resolves.toBe(true)
    expect(writtenMeta()).toMatchObject({
      new_lms_pages_enabled: true,
      new_lms_try_new_tour_seen: true,
    })
  })
})
