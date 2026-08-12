import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  ensureAccess: vi.fn(),
  isSupportedLecture: vi.fn(),
  appendZoomChat: vi.fn(),
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
  isSupportedLectureDetailType: hoisted.isSupportedLecture,
}))

vi.mock('@/server/learn/utils/normalizeResourceKind', () => ({
  isSupportedResourceLectureType: vi.fn(() => true),
}))

vi.mock('@/server/learn/utils/buildAssignmentDetailPayload', () => ({
  isSupportedAssignmentDetailType: vi.fn(() => true),
}))

vi.mock('@/server/learn/utils/appendZoomChatToNotes', () => ({
  appendZoomChatToNotes: hoisted.appendZoomChat,
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

describe('notesPreviewQueries lecture helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.isSupportedLecture.mockReturnValue(true)
    hoisted.appendZoomChat.mockImplementation((notes: string | null) => notes)
    hoisted.normalizeText.mockImplementation(
      (value: string | null | undefined) => {
        if (value == null) return null
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
      },
    )
  })

  describe('fetchLectureNotesForUser', () => {
    it('returns notes with zoom-chat append', async () => {
      hoisted.selectQueue = [
        [{ notes: '# Notes', type: 'live', sectionId: 2 }],
        [{ finalChat: [{ url: 'https://example.com' }] }],
      ]
      hoisted.appendZoomChat.mockReturnValueOnce(
        '# Notes\n\nResources shared :-\n\n1. https://example.com',
      )
      const { fetchLectureNotesForUser } = await importQueries()

      await expect(fetchLectureNotesForUser(7, 42)).resolves.toBe(
        '# Notes\n\nResources shared :-\n\n1. https://example.com',
      )
      expect(hoisted.appendZoomChat).toHaveBeenCalledWith('# Notes', [
        { url: 'https://example.com' },
      ])
      expect(hoisted.ensureAccess).toHaveBeenCalledWith(7, 2)
    })

    it('passes null finalChat when zoom-chat row is missing', async () => {
      hoisted.selectQueue = [
        [{ notes: 'Plain notes', type: 'live', sectionId: 2 }],
        [],
      ]
      const { fetchLectureNotesForUser } = await importQueries()

      await expect(fetchLectureNotesForUser(7, 42)).resolves.toBe('Plain notes')
      expect(hoisted.appendZoomChat).toHaveBeenCalledWith('Plain notes', null)
    })

    it('throws when the lecture row is missing', async () => {
      hoisted.selectQueue = [[]]
      const { fetchLectureNotesForUser } = await importQueries()

      await expect(fetchLectureNotesForUser(7, 999)).rejects.toThrow(
        'LEARN_DETAIL_NOT_FOUND',
      )
    })

    it('throws when the lecture type is unsupported', async () => {
      hoisted.selectQueue = [[{ notes: 'x', type: 'unknown', sectionId: 2 }]]
      hoisted.isSupportedLecture.mockReturnValueOnce(false)
      const { fetchLectureNotesForUser } = await importQueries()

      await expect(fetchLectureNotesForUser(7, 42)).rejects.toThrow(
        'LEARN_DETAIL_NOT_FOUND',
      )
    })

    it('throws when the user cannot access the lecture', async () => {
      hoisted.selectQueue = [[{ notes: 'x', type: 'live', sectionId: 2 }]]
      hoisted.ensureAccess.mockResolvedValueOnce(false)
      const { fetchLectureNotesForUser } = await importQueries()

      await expect(fetchLectureNotesForUser(7, 42)).rejects.toThrow(
        'LEARN_DETAIL_NOT_FOUND',
      )
    })
  })

  describe('fetchLectureSummaryForUser', () => {
    it('returns the normalized AI summary', async () => {
      hoisted.selectQueue = [
        [{ notes: null, type: 'live', sectionId: 2 }],
        [{ summary: '  AI summary  ' }],
      ]
      const { fetchLectureSummaryForUser } = await importQueries()

      await expect(fetchLectureSummaryForUser(7, 42)).resolves.toBe(
        'AI summary',
      )
      expect(hoisted.normalizeText).toHaveBeenCalledWith('  AI summary  ')
    })

    it('returns null when there is no AI row', async () => {
      hoisted.selectQueue = [[{ notes: null, type: 'live', sectionId: 2 }], []]
      const { fetchLectureSummaryForUser } = await importQueries()

      await expect(fetchLectureSummaryForUser(7, 42)).resolves.toBeNull()
      expect(hoisted.normalizeText).toHaveBeenCalledWith(null)
    })

    it('throws when access is denied', async () => {
      hoisted.selectQueue = [[{ notes: null, type: 'live', sectionId: 2 }]]
      hoisted.ensureAccess.mockResolvedValueOnce(false)
      const { fetchLectureSummaryForUser } = await importQueries()

      await expect(fetchLectureSummaryForUser(7, 42)).rejects.toThrow(
        'LEARN_DETAIL_NOT_FOUND',
      )
    })
  })
})
