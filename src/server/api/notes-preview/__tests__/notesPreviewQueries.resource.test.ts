import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  ensureAccess: vi.fn(),
  isSupportedResource: vi.fn(),
  normalizeText: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema', () => ({
  lectures: {},
  lecturesAi: {},
  lectureZoomChat: {},
  assignments: {},
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

vi.mock('@/server/learn/utils/buildLectureDetailPayload', () => ({
  isSupportedLectureDetailType: vi.fn(() => true),
}))

vi.mock('@/server/learn/utils/normalizeResourceKind', () => ({
  isSupportedResourceLectureType: hoisted.isSupportedResource,
}))

vi.mock('@/server/learn/utils/buildAssignmentDetailPayload', () => ({
  isSupportedAssignmentDetailType: vi.fn(() => true),
}))

vi.mock('@/server/learn/utils/appendZoomChatToNotes', () => ({
  appendZoomChatToNotes: vi.fn((notes: string | null) => notes),
}))

vi.mock('@/server/learn/utils/normalizeNullableText', () => ({
  normalizeNullableText: hoisted.normalizeText,
}))

vi.mock('@/server/learn/utils/resolveLectureLearningType', () => ({
  LECTURE_RESOURCE_TYPE: 'reading',
}))

async function importQueries() {
  return import('../notesPreviewQueries')
}

function resourceRow(
  overrides: Partial<{
    notes: string | null
    description: string | null
    type: string
    sectionId: number
  }> = {},
) {
  return {
    notes: 'x',
    description: null as string | null,
    type: 'reading',
    sectionId: 3,
    ...overrides,
  }
}

describe('fetchResourceBodyForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.isSupportedResource.mockReturnValue(true)
    hoisted.normalizeText.mockImplementation(
      (value: string | null | undefined) => {
        if (value == null) return null
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
      },
    )
  })

  it('prefers notes over description', async () => {
    hoisted.selectQueue = [
      [resourceRow({ notes: 'Notes body', description: 'Description body' })],
    ]
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 515)).resolves.toBe('Notes body')
    expect(hoisted.ensureAccess).toHaveBeenCalledWith(7, 3)
  })

  it('falls back to description when notes are empty', async () => {
    hoisted.selectQueue = [
      [resourceRow({ notes: '   ', description: 'Description body' })],
    ]
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 515)).resolves.toBe(
      'Description body',
    )
  })

  it('returns null when both notes and description are empty', async () => {
    hoisted.selectQueue = [[resourceRow({ notes: null, description: '  ' })]]
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 515)).resolves.toBeNull()
  })

  it('throws when the resource row is missing', async () => {
    hoisted.selectQueue = [[]]
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 999)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })

  it('throws RESOURCE_DETAIL_UNSUPPORTED_TYPE for unsupported type', async () => {
    hoisted.selectQueue = [[resourceRow()]]
    hoisted.isSupportedResource.mockReturnValueOnce(false)
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 515)).rejects.toThrow(
      'RESOURCE_DETAIL_UNSUPPORTED_TYPE',
    )
  })

  it('throws when the user cannot access the resource', async () => {
    hoisted.selectQueue = [[resourceRow()]]
    hoisted.ensureAccess.mockResolvedValueOnce(false)
    const { fetchResourceBodyForUser } = await importQueries()

    await expect(fetchResourceBodyForUser(7, 515)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })
})
