import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  ensureAccess: vi.fn(),
  listDiscussions: vi.fn(),
  associatedContent: vi.fn(),
  bookmarkState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

vi.mock(
  '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity',
  () => ({
    listDiscussionsWithThreadsForLearnEntity: hoisted.listDiscussions,
  }),
)

vi.mock('@/server/learn/services/getLectureAssociatedContent.service', () => ({
  getLectureAssociatedContent: hoisted.associatedContent,
}))

vi.mock('@/server/learn/services/learnEntityBookmark.service', () => ({
  getLearnEntityBookmarkState: hoisted.bookmarkState,
}))

function mockResourceRow(overrides: Record<string, unknown> = {}) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      leftJoin: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 515,
                title: 'Week 1 Pre-read',
                category: 'pre-read',
                type: 'reading',
                optional: 0,
                schedule: '2026-05-20 10:00:00',
                concludes: '2026-05-20 12:00:00',
                week: 1,
                module: null,
                batchId: 10,
                sectionId: 20,
                hostName: 'Ravi',
                hostAvatarUrl: '/avatar.png',
                notes: 'Read chapter 2',
                description: null,
                settings: null,
                data: null,
                ...overrides,
              },
            ]),
        }),
      }),
    }),
  })
}

describe('getResourceLearningDetailForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.listDiscussions.mockResolvedValue([])
    hoisted.associatedContent.mockResolvedValue([])
    hoisted.bookmarkState.mockResolvedValue(false)
  })

  it('returns resource payload with bookmark state from the bookmark service', async () => {
    mockResourceRow()
    hoisted.bookmarkState.mockResolvedValue(true)
    const { getResourceLearningDetailForUser } = await import(
      '../services/getResourceLearningDetail.service'
    )

    const payload = await getResourceLearningDetailForUser(7, 515)

    expect(payload.id).toBe(515)
    expect(payload.resourceKind).toBe('pre-read')
    expect(payload.isBookmarked).toBe(true)
    expect(hoisted.bookmarkState).toHaveBeenCalledWith(7, 'resource', 515)
  })

  it('throws when the resource does not exist', async () => {
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        leftJoin: () => ({
          where: () => ({ limit: () => Promise.resolve([]) }),
        }),
      }),
    })
    const { getResourceLearningDetailForUser } = await import(
      '../services/getResourceLearningDetail.service'
    )

    await expect(getResourceLearningDetailForUser(7, 999)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })

  it('throws when the user cannot access the resource batch/section', async () => {
    mockResourceRow()
    hoisted.ensureAccess.mockResolvedValue(false)
    const { getResourceLearningDetailForUser } = await import(
      '../services/getResourceLearningDetail.service'
    )

    await expect(getResourceLearningDetailForUser(7, 515)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })
})
