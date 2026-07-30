import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  ensureAccess: vi.fn(),
  isSupportedAssignment: vi.fn(),
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
  isSupportedResourceLectureType: vi.fn(() => true),
}))

vi.mock('@/server/learn/utils/buildAssignmentDetailPayload', () => ({
  isSupportedAssignmentDetailType: hoisted.isSupportedAssignment,
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

function assignmentRow(
  overrides: Partial<{
    instructions: string | null
    type: string
    sectionId: number
  }> = {},
) {
  return {
    instructions: 'x',
    type: 'assignment',
    sectionId: 4,
    ...overrides,
  }
}

describe('fetchAssignmentInstructionsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.isSupportedAssignment.mockReturnValue(true)
    hoisted.normalizeText.mockImplementation(
      (value: string | null | undefined) => {
        if (value == null) return null
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
      },
    )
  })

  it('returns trimmed instructions', async () => {
    hoisted.selectQueue = [
      [assignmentRow({ instructions: '  Do the thing  ' })],
    ]
    const { fetchAssignmentInstructionsForUser } = await importQueries()

    await expect(fetchAssignmentInstructionsForUser(3, 900)).resolves.toBe(
      'Do the thing',
    )
    expect(hoisted.ensureAccess).toHaveBeenCalledWith(3, 4)
  })

  it('returns null for whitespace-only instructions', async () => {
    hoisted.selectQueue = [[assignmentRow({ instructions: '   ' })]]
    const { fetchAssignmentInstructionsForUser } = await importQueries()

    await expect(fetchAssignmentInstructionsForUser(3, 900)).resolves.toBeNull()
  })

  it('throws when the assignment row is missing', async () => {
    hoisted.selectQueue = [[]]
    const { fetchAssignmentInstructionsForUser } = await importQueries()

    await expect(fetchAssignmentInstructionsForUser(3, 999)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })

  it('throws ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE for unsupported type', async () => {
    hoisted.selectQueue = [[assignmentRow({ type: 'unknown' })]]
    hoisted.isSupportedAssignment.mockReturnValueOnce(false)
    const { fetchAssignmentInstructionsForUser } = await importQueries()

    await expect(fetchAssignmentInstructionsForUser(3, 900)).rejects.toThrow(
      'ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE',
    )
  })

  it('throws when the user cannot access the assignment', async () => {
    hoisted.selectQueue = [[assignmentRow()]]
    hoisted.ensureAccess.mockResolvedValueOnce(false)
    const { fetchAssignmentInstructionsForUser } = await importQueries()

    await expect(fetchAssignmentInstructionsForUser(3, 900)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })
})
