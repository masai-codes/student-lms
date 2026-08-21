import { describe, expect, it, vi } from 'vitest'

import { applyPortalNewLmsDefaults } from '@/server/api/webhooks/admissions/steps/applyPortalNewLmsDefaults'
import type { DbTransaction } from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

/**
 * Fake tx: `select().from().where().limit()` resolves to a single row holding
 * `meta`, and `update().set().where()` records what would be written.
 */
function tx(meta: unknown) {
  const set = vi.fn((_values: { meta: Record<string, unknown> }) => ({
    where: () => Promise.resolve(undefined),
  }))
  const select = vi.fn(() => ({
    from: () => ({
      where: () => ({ limit: () => Promise.resolve([{ meta }]) }),
    }),
  }))
  const handle = {
    select,
    update: () => ({ set }),
  } as unknown as DbTransaction
  return { handle, set, select }
}

/** The meta object the step wrote, or undefined if it never wrote. */
function writtenMeta(set: ReturnType<typeof tx>['set']) {
  return set.mock.calls[0]?.[0].meta
}

describe('applyPortalNewLmsDefaults', () => {
  it('sets both flags for an iitj user with no meta', async () => {
    const { handle, set } = tx(null)

    await applyPortalNewLmsDefaults(handle, { userId: 7, client: 'iitj' })

    expect(writtenMeta(set)).toMatchObject({
      new_lms_pages_enabled: true,
      hide_switch_option: true,
    })
  })

  it('preserves unrelated meta keys already on the user', async () => {
    const { handle, set } = tx({ profile_pic: 'https://example.com/a.png' })

    await applyPortalNewLmsDefaults(handle, { userId: 7, client: 'iitj' })

    expect(writtenMeta(set)).toMatchObject({
      profile_pic: 'https://example.com/a.png',
      new_lms_pages_enabled: true,
      hide_switch_option: true,
    })
  })

  it('does not overwrite an explicit existing value, only fills the gap', async () => {
    const { handle, set } = tx({ new_lms_pages_enabled: false })

    await applyPortalNewLmsDefaults(handle, { userId: 7, client: 'iitj' })

    expect(writtenMeta(set)).toMatchObject({
      new_lms_pages_enabled: false,
      hide_switch_option: true,
    })
  })

  it('skips the write entirely when both flags are already present', async () => {
    const { handle, set } = tx({
      new_lms_pages_enabled: true,
      hide_switch_option: true,
    })

    await applyPortalNewLmsDefaults(handle, { userId: 7, client: 'iitj' })

    expect(set).not.toHaveBeenCalled()
  })

  it('treats a non-object meta as empty rather than throwing', async () => {
    const { handle, set } = tx('not-an-object')

    await applyPortalNewLmsDefaults(handle, { userId: 7, client: 'iitj' })

    expect(writtenMeta(set)).toEqual({
      new_lms_pages_enabled: true,
      hide_switch_option: true,
    })
  })

  it.each(['masai', 'ihub'] as const)(
    'is a no-op for the %s client — it never even reads the user',
    async (client) => {
      const { handle, set, select } = tx(null)

      await applyPortalNewLmsDefaults(handle, { userId: 7, client })

      expect(select).not.toHaveBeenCalled()
      expect(set).not.toHaveBeenCalled()
    },
  )
})
