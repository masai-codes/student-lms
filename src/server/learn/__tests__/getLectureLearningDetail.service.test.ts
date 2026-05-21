import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  ensureAccess: vi.fn(),
  listDiscussions: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

vi.mock('@/server/new-discussions/services/listDiscussionsForLearnEntity', () => ({
  listDiscussionsForLearnEntity: hoisted.listDiscussions,
}))

describe('getLectureLearningDetailForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.listDiscussions.mockResolvedValue([])
  })

  it('returns lecture detail payload for supported live lectures', async () => {
    const { getLectureLearningDetailForUser } = await import(
      '../services/getLectureLearningDetail.service'
    )

    hoisted.dbSelect.mockReturnValue({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 227,
                  title: 'Live DSA',
                  category: 'coding',
                  type: 'live',
                  optional: 0,
                  schedule: '2020-01-01 10:00:00',
                  concludes: '2020-01-01 12:00:00',
                  week: 1,
                  module: null,
                  batchId: 1,
                  sectionId: 2,
                  hostName: 'Ravi',
                  hostAvatarUrl: null,
                  zoomLink: null,
                  videos: null,
                  vimeoDownloadLinks: null,
                  vimeoPlayerEmbedUrl: null,
                  settings: null,
                },
              ]),
          }),
        }),
      }),
    })

    const result = await getLectureLearningDetailForUser(9, 227)

    expect(result.id).toBe(227)
    expect(result.lectureKind).toBe('live')
    expect(result.livePhase).toBe('after')
    expect(result.discussions).toEqual([])
  })

  it('throws when lecture type is unsupported', async () => {
    const { getLectureLearningDetailForUser } = await import(
      '../services/getLectureLearningDetail.service'
    )

    hoisted.dbSelect.mockReturnValue({
      from: () => ({
        leftJoin: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 1,
                  title: 'Scrum',
                  category: 'coding',
                  type: 'scrum',
                  optional: 0,
                  schedule: null,
                  concludes: null,
                  week: 1,
                  module: null,
                  batchId: 1,
                  sectionId: 2,
                  hostName: 'Ravi',
                  hostAvatarUrl: null,
                  zoomLink: null,
                  videos: null,
                  vimeoDownloadLinks: null,
                  vimeoPlayerEmbedUrl: null,
                  settings: null,
                },
              ]),
          }),
        }),
      }),
    })

    await expect(getLectureLearningDetailForUser(9, 1)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })
})
