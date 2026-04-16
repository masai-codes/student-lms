import { describe, expect, it, vi } from 'vitest'
import {
  getMocks,
  mockSelectChain,
  mockSelectWhereChain,
  registerCommonBeforeEach,
} from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('masaiverse membership and joins', () => {
  it('fetchMyEventEnrollments returns empty list when no user', async () => {
    const { fetchMyEventEnrollmentsHandler } = await import('../fetchMyEventEnrollments')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(fetchMyEventEnrollmentsHandler()).resolves.toEqual([])
  })

  it('fetchMyEventEnrollments returns enrolled event ids', async () => {
    const { fetchMyEventEnrollmentsHandler } = await import('../fetchMyEventEnrollments')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(7)
    mocks.dbSelect.mockReturnValueOnce(
      mockSelectWhereChain([{ eventId: 'ev-1' }, { eventId: 'ev-2' }]),
    )

    await expect(fetchMyEventEnrollmentsHandler()).resolves.toEqual(['ev-1', 'ev-2'])
  })

  it('fetchMyClubMembership normalizes alt lead role', async () => {
    const { fetchMyClubMembershipHandler } = await import('../fetchMyClubMembership')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(8)
    mocks.dbSelect.mockReturnValueOnce(mockSelectChain([{ clubId: 'club-1', role: 'ALT_LEAD' }]))

    await expect(fetchMyClubMembershipHandler()).resolves.toEqual({
      joinedClubId: 'club-1',
      role: 'ALT_LEAD',
      isAltLead: true,
    })
  })

  it('joinClub rejects unauthorized users', async () => {
    const { joinClubHandler } = await import('../joinClub')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(joinClubHandler({ data: { clubId: 'club-1' } })).rejects.toThrow('UNAUTHORIZED')
  })

  it('joinClub returns already-joined state without inserting', async () => {
    const { joinClubHandler } = await import('../joinClub')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(10)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([{ id: 'club-1' }]))
      .mockReturnValueOnce(mockSelectChain([{ clubId: 'club-2' }]))

    const insertValues = vi.fn()
    mocks.dbInsert.mockReturnValueOnce({ values: insertValues })

    await expect(joinClubHandler({ data: { clubId: 'club-1' } })).resolves.toEqual({
      success: false,
      joinedClubId: 'club-2',
      reason: 'ALREADY_JOINED_A_CLUB',
    })
    expect(insertValues).not.toHaveBeenCalled()
  })

  it('joinEvent enrolls when event exists and user is not enrolled', async () => {
    const { joinEventHandler } = await import('../joinEvent')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(13)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([{ id: 'ev-1' }]))
      .mockReturnValueOnce(mockSelectChain([]))

    mocks.dbInsert.mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) })

    await expect(joinEventHandler({ data: { eventId: ' ev-1 ' } })).resolves.toEqual({
      success: true,
      enrolledEventId: 'ev-1',
      reason: 'ENROLLED',
    })
    expect(mocks.dbInsert).toHaveBeenCalledTimes(1)
  })

  it('joinEvent returns already-enrolled without insert', async () => {
    const { joinEventHandler } = await import('../joinEvent')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(13)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([{ id: 'ev-1' }]))
      .mockReturnValueOnce(mockSelectChain([{ id: 'enr-1' }]))

    const insertValues = vi.fn()
    mocks.dbInsert.mockReturnValueOnce({ values: insertValues })

    await expect(joinEventHandler({ data: { eventId: 'ev-1' } })).resolves.toEqual({
      success: true,
      enrolledEventId: 'ev-1',
      reason: 'ALREADY_ENROLLED',
    })
    expect(insertValues).not.toHaveBeenCalled()
  })
})
