import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  users: { meta: 'users.meta' },
  clubMembers: { userId: 'club_members.user_id' },
  posts: { createdAt: 'posts.created_at' },
  replies: { createdAt: 'replies.created_at' },
  events: { startTime: 'events.start_time' },
  eventEnrollments: { enrolledAt: 'event_enrollments.enrolled_at' },
}))

/** Resolves a `select(...).from(...).where(...)` chain. */
function selectFromWhere(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

const NOW = new Date('2026-06-03T12:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCommunityLearnerCount', () => {
  it('returns the distinct learner count', async () => {
    const { getCommunityLearnerCount } = await import(
      '../services/getCommunityLearnerCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([{ count: 2841 }]))

    await expect(getCommunityLearnerCount()).resolves.toBe(2841)
  })

  it('falls back to 0 when the query returns no rows', async () => {
    const { getCommunityLearnerCount } = await import(
      '../services/getCommunityLearnerCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([]))

    await expect(getCommunityLearnerCount()).resolves.toBe(0)
  })
})

describe('getDiscussionsThisMonthCount', () => {
  it('sums posts and replies created this month', async () => {
    const { getDiscussionsThisMonthCount } = await import(
      '../services/getDiscussionsThisMonthCount.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce(selectFromWhere([{ count: 30 }]))
      .mockReturnValueOnce(selectFromWhere([{ count: 8 }]))

    await expect(getDiscussionsThisMonthCount(NOW)).resolves.toBe(38)
  })

  it('treats missing rows as zero on both sides', async () => {
    const { getDiscussionsThisMonthCount } = await import(
      '../services/getDiscussionsThisMonthCount.service'
    )
    hoisted.dbSelect
      .mockReturnValueOnce(selectFromWhere([]))
      .mockReturnValueOnce(selectFromWhere([]))

    await expect(getDiscussionsThisMonthCount(NOW)).resolves.toBe(0)
  })
})

describe('getEventsThisYearCount', () => {
  it('returns the count of events scheduled this year', async () => {
    const { getEventsThisYearCount } = await import(
      '../services/getEventsThisYearCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([{ count: 6 }]))

    await expect(getEventsThisYearCount(NOW)).resolves.toBe(6)
  })

  it('falls back to 0 when there are no rows', async () => {
    const { getEventsThisYearCount } = await import(
      '../services/getEventsThisYearCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([]))

    await expect(getEventsThisYearCount(NOW)).resolves.toBe(0)
  })
})

describe('getEventRegistrationsThisYearCount', () => {
  it('returns the count of registrations this year', async () => {
    const { getEventRegistrationsThisYearCount } = await import(
      '../services/getEventRegistrationsThisYearCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([{ count: 124 }]))

    await expect(getEventRegistrationsThisYearCount(NOW)).resolves.toBe(124)
  })

  it('falls back to 0 when there are no rows', async () => {
    const { getEventRegistrationsThisYearCount } = await import(
      '../services/getEventRegistrationsThisYearCount.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectFromWhere([]))

    await expect(getEventRegistrationsThisYearCount(NOW)).resolves.toBe(0)
  })
})
