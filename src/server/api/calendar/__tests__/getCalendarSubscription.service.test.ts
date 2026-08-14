import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  findUserIdByCalendarToken,
  getCalendarSubscriptionLink,
} from '../getCalendarSubscription.service'

const hoisted = vi.hoisted(() => ({
  selectRows: [] as Array<Record<string, unknown>>,
  updateSet: vi.fn(),
}))

vi.mock('@/db', () => {
  const selectChain: Record<string, unknown> = {
    select: () => selectChain,
    from: () => selectChain,
    where: () => selectChain,
    limit: () => Promise.resolve(hoisted.selectRows),
  }
  const updateChain = {
    set: (values: unknown) => {
      hoisted.updateSet(values)
      return { where: () => Promise.resolve() }
    },
  }
  return {
    db: {
      select: () => selectChain,
      update: () => updateChain,
    },
  }
})

const ORIGIN = 'https://lms.example.com'
const EXISTING_TOKEN = 'a'.repeat(32)

describe('getCalendarSubscriptionLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectRows = []
  })

  it('reuses an existing token without writing', async () => {
    hoisted.selectRows = [{ meta: { calendar_token: EXISTING_TOKEN } }]
    const result = await getCalendarSubscriptionLink(9, ORIGIN)
    expect(result.calendarUrl).toBe(
      `${ORIGIN}/api/calendar/feed/${EXISTING_TOKEN}.ics`,
    )
    expect(hoisted.updateSet).not.toHaveBeenCalled()
  })

  it('mints and persists a token when none exists, preserving other meta', async () => {
    hoisted.selectRows = [{ meta: { showWelcomeModal: true } }]
    const result = await getCalendarSubscriptionLink(9, ORIGIN)
    expect(result.calendarUrl).toMatch(
      new RegExp(`^${ORIGIN}/api/calendar/feed/[a-f0-9]{32}\\.ics$`),
    )
    const written = hoisted.updateSet.mock.calls[0][0] as {
      meta: Record<string, unknown>
    }
    expect(written.meta.showWelcomeModal).toBe(true)
    expect(written.meta.calendar_token).toMatch(/^[a-f0-9]{32}$/)
  })

  it('mints when meta is null', async () => {
    hoisted.selectRows = [{ meta: null }]
    const result = await getCalendarSubscriptionLink(9, ORIGIN)
    expect(result.calendarUrl).toContain('/api/calendar/feed/')
    expect(hoisted.updateSet).toHaveBeenCalled()
  })

  it('throws when the user row is missing', async () => {
    hoisted.selectRows = []
    await expect(getCalendarSubscriptionLink(9, ORIGIN)).rejects.toThrow(
      'SERVER_ERROR_FETCHING_CALENDAR_SUBSCRIPTION_LINK',
    )
  })
})

describe('findUserIdByCalendarToken', () => {
  beforeEach(() => {
    hoisted.selectRows = []
  })

  it('rejects malformed tokens without querying', async () => {
    hoisted.selectRows = [{ id: 9 }]
    expect(await findUserIdByCalendarToken('short')).toBeNull()
    expect(await findUserIdByCalendarToken('../../etc/passwd')).toBeNull()
  })

  it('resolves a well-formed token to a user id', async () => {
    hoisted.selectRows = [{ id: 9 }]
    expect(await findUserIdByCalendarToken(EXISTING_TOKEN)).toBe(9)
  })

  it('returns null when no user matches', async () => {
    expect(await findUserIdByCalendarToken(EXISTING_TOKEN)).toBeNull()
  })
})
