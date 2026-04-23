import { describe, expect, it } from 'vitest'
import {
  getMocks,
  mockSelectChain,
  mockSelectOrderByChain,
  mockSelectWhereChain,
  registerCommonBeforeEach,
} from './testSetup'

registerCommonBeforeEach()
const mocks = getMocks()

describe('masaiverse listings', () => {
  it('fetchAllClubs maps null meta and returns rows', async () => {
    const { fetchAllClubsHandler } = await import('../fetchClubs')
    mocks.dbSelect
      .mockReturnValueOnce(
        mockSelectOrderByChain([
          { id: 'club-1', name: 'A', meta: null },
          { id: 'club-2', name: 'B', meta: { mini_description: 'x' } },
        ]),
      )
      .mockReturnValueOnce({
        from: () => ({
          groupBy: () =>
            Promise.resolve([
              { clubId: 'club-1', memberCount: 2 },
              { clubId: 'club-2', memberCount: 4 },
            ]),
        }),
      })

    await expect(fetchAllClubsHandler()).resolves.toEqual([
      { id: 'club-1', name: 'A', meta: null, joinedMemberCount: 2 },
      { id: 'club-2', name: 'B', meta: { mini_description: 'x' }, joinedMemberCount: 4 },
    ])
  })

  it('fetchAllClubs throws stable error when db fails', async () => {
    const { fetchAllClubsHandler } = await import('../fetchClubs')
    mocks.dbSelect.mockImplementationOnce(() => {
      throw new Error('db fail')
    })

    await expect(fetchAllClubsHandler()).rejects.toThrow('SERVER_ERROR_FETCHING_CLUBS')
  })

  it('fetchAllEvents returns events and prioritizes joined active events', async () => {
    const { fetchAllEventsHandler } = await import('../fetchEvents')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(99)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([{ role: 'student' }]))
      .mockReturnValueOnce(mockSelectWhereChain([{ clubId: 'club-joined' }]))
      .mockReturnValueOnce(
        mockSelectOrderByChain([
          {
            id: 'e-other',
            clubId: null,
            startTime: '2030-01-01T11:00:00.000Z',
            endTime: '2030-01-01T12:00:00.000Z',
            createdAt: '2030-01-01T10:00:00.000Z',
            title: 'Other',
          },
          {
            id: 'e-joined',
            clubId: 'club-joined',
            startTime: '2030-01-01T13:00:00.000Z',
            endTime: '2030-01-01T14:00:00.000Z',
            createdAt: '2030-01-01T09:00:00.000Z',
            title: 'Joined',
          },
        ]),
      )

    const result = await fetchAllEventsHandler({ data: { searchQuery: '  any  ' } })
    expect(result.map((event) => event.id)).toEqual(['e-joined', 'e-other'])
  })

  it('fetchAllEvents returns all events for admin users', async () => {
    const { fetchAllEventsHandler } = await import('../fetchEvents')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(99)
    mocks.dbSelect
      .mockReturnValueOnce(mockSelectChain([{ role: 'admin' }]))
      .mockReturnValueOnce(
        mockSelectOrderByChain([
          {
            id: 'e-club',
            clubId: 'club-1',
            startTime: '2030-01-01T13:00:00.000Z',
            endTime: '2030-01-01T14:00:00.000Z',
            createdAt: '2030-01-01T09:00:00.000Z',
            title: 'Club Event',
          },
          {
            id: 'e-open',
            clubId: null,
            startTime: '2030-01-01T11:00:00.000Z',
            endTime: '2030-01-01T12:00:00.000Z',
            createdAt: '2030-01-01T10:00:00.000Z',
            title: 'Open Event',
          },
        ]),
      )

    const result = await fetchAllEventsHandler({ data: {} })
    expect(result.map((event) => event.id)).toEqual(['e-club', 'e-open'])
  })

  it('fetchAllEvents throws stable error when query fails', async () => {
    const { fetchAllEventsHandler } = await import('../fetchEvents')
    mocks.getCurrentSessionUserId.mockResolvedValueOnce(null)
    mocks.dbSelect.mockImplementationOnce(() => {
      throw new Error('events db error')
    })

    await expect(fetchAllEventsHandler({ data: {} })).rejects.toThrow('SERVER_ERROR_FETCHING_EVENTS')
  })
})
