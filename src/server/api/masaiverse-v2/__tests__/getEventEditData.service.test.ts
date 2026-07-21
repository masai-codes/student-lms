import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    title: 'events.title',
    description: 'events.description',
    category: 'events.category',
    mode: 'events.mode',
    clubId: 'events.club_id',
    locationTitle: 'events.location_title',
    locationMapLink: 'events.location_map_link',
    eventLink: 'events.event_link',
    imageLink: 'events.image_link',
    platform: 'events.platform',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
    meta: 'events.meta',
  },
  clubs: { id: 'clubs.id', name: 'clubs.name' },
}))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))
vi.mock('@/utils/timeZoneHandler', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/timeZoneHandler')>()),
  parseMasaiverseEventDbTimestamp: (value: string | null) =>
    value ? new Date(`${value.replace(' ', 'T')}Z`) : null,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

function clubsChain(rows: unknown) {
  return { from: () => ({ orderBy: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getEventEditData', () => {
  it('rejects a non-admin with a 403', async () => {
    const { getEventEditData } =
      await import('../services/getEventEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })
    await expect(getEventEditData(1, 5)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
  })

  it('404s when the event is missing', async () => {
    const { getEventEditData } =
      await import('../services/getEventEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getEventEditData(1, 99)).rejects.toMatchObject({
      status: 404,
      code: 'EVENT_NOT_FOUND',
    })
  })

  it('returns columns (timestamps as UTC ISO) + raw meta', async () => {
    const { getEventEditData } =
      await import('../services/getEventEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 5,
          title: 'Sprint',
          description: 'd',
          category: 'hackathon',
          mode: 'online',
          clubId: 7,
          locationTitle: null,
          locationMapLink: null,
          eventLink: 'https://meet',
          imageLink: 'https://cdn/i.png',
          platform: 'Meet',
          startTime: '2026-06-10 09:00:00',
          endTime: null,
          meta: { isPublished: true, hostedBy: [] },
        },
      ]),
    )
    hoisted.dbSelect.mockReturnValueOnce(
      clubsChain([
        { id: 7, name: 'Code Club' },
        { id: 9, name: 'Design Guild' },
      ]),
    )

    await expect(getEventEditData(1, 5)).resolves.toEqual({
      id: '5',
      columns: {
        title: 'Sprint',
        description: 'd',
        category: 'hackathon',
        mode: 'online',
        clubId: '7',
        locationTitle: null,
        locationMapLink: null,
        eventLink: 'https://meet',
        imageLink: 'https://cdn/i.png',
        platform: 'Meet',
        startTime: '2026-06-10T09:00:00.000Z',
        endTime: null,
      },
      meta: { isPublished: true, hostedBy: [] },
      clubs: [
        { id: '7', name: 'Code Club' },
        { id: '9', name: 'Design Guild' },
      ],
    })
  })
})
