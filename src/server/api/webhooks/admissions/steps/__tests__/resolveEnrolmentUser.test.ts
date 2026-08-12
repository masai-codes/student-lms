import { describe, expect, it, vi } from 'vitest'

import { resolveEnrolmentUser } from '@/server/api/webhooks/admissions/steps/resolveEnrolmentUser'
import type {
  CreateEnrolmentInput,
  DbTransaction,
} from '@/server/api/webhooks/admissions/types'

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('bcryptjs', () => ({ hash: vi.fn(async () => 'hashed') }))

const INPUT = {
  email: 'a@example.com',
  name: 'A',
  mobile: '9999999999',
  password: 'pw',
  batch_id: 1,
} as unknown as CreateEnrolmentInput

/**
 * Fake tx: `select()...limit()` resolves to `existingRows`, and `insert().values()`
 * records the inserted row while returning an insertId.
 */
function tx(existingRows: Array<{ id: number }>) {
  const values = vi.fn((_row: Record<string, unknown>) =>
    Promise.resolve([{ insertId: 42 }]),
  )
  const handle = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(existingRows) }),
      }),
    }),
    insert: () => ({ values }),
  } as unknown as DbTransaction
  return { handle, values }
}

describe('resolveEnrolmentUser', () => {
  it('creates a new student with both new-LMS flags on meta', async () => {
    const { handle, values } = tx([])

    const userId = await resolveEnrolmentUser(handle, INPUT, 'masai')

    expect(userId).toBe(42)
    expect(values.mock.calls[0]?.[0]).toMatchObject({
      role: 'student',
      meta: { new_lms_pages_enabled: true, hide_switch_option: true },
    })
  })

  it.each(['masai', 'ihub', 'iitj'] as const)(
    'sets the flags regardless of client (%s)',
    async (client) => {
      const { handle, values } = tx([])

      await resolveEnrolmentUser(handle, INPUT, client)

      expect(values.mock.calls[0]?.[0]?.meta).toEqual({
        new_lms_pages_enabled: true,
        hide_switch_option: true,
      })
    },
  )

  it('reuses an existing user without touching their meta', async () => {
    const { handle, values } = tx([{ id: 7 }])

    const userId = await resolveEnrolmentUser(handle, INPUT, 'masai')

    expect(userId).toBe(7)
    expect(values).not.toHaveBeenCalled()
  })
})
