import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db/schema', () => ({
  events: { clubId: 'events.club_id', meta: 'events.meta' },
}))

describe('eventScopeConditions', () => {
  it('returns no conditions for an unscoped listing', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions()).toEqual([])
    expect(eventScopeConditions({})).toEqual([])
  })

  it('adds a club condition for a finite club id', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ clubId: 5 })).toHaveLength(1)
  })

  it('ignores a non-finite club id', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ clubId: Number.NaN })).toEqual([])
  })

  it('adds a public-only (club_id is null) condition', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ publicOnly: true })).toHaveLength(1)
    expect(eventScopeConditions({ publicOnly: false })).toEqual([])
  })

  it('adds a public-or-member-clubs condition for a non-empty visibleClubIds', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ visibleClubIds: [3, 7] })).toHaveLength(1)
  })

  it('falls back to public-only when visibleClubIds is empty', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ visibleClubIds: [] })).toHaveLength(1)
  })

  it('ignores non-finite ids inside visibleClubIds', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    // Only NaN ids → treated as "public only" (still one condition).
    expect(eventScopeConditions({ visibleClubIds: [Number.NaN] })).toHaveLength(
      1,
    )
  })

  it('adds the weekly-connect only/exclude condition', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(eventScopeConditions({ weeklyConnect: 'only' })).toHaveLength(1)
    expect(eventScopeConditions({ weeklyConnect: 'exclude' })).toHaveLength(1)
  })

  it('combines club + weekly-connect conditions', async () => {
    const { eventScopeConditions } = await import('../services/eventScope')
    expect(
      eventScopeConditions({ clubId: 5, weeklyConnect: 'only' }),
    ).toHaveLength(2)
  })
})
