import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  insertCalls: [] as Array<{
    table: unknown
    values: unknown
    set?: unknown
  }>,
  updateCalls: [] as Array<{ table: unknown; set: unknown }>,
  ensureAccess: vi.fn(),
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
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        const call = { table, values, set: undefined as unknown }
        hoisted.insertCalls.push(call)
        return {
          onDuplicateKeyUpdate: ({ set }: { set: unknown }) => {
            call.set = set
            return Promise.resolve(undefined)
          },
        }
      },
    }),
    update: (table: unknown) => ({
      set: (set: unknown) => ({
        where: () => {
          hoisted.updateCalls.push({ table, set })
          return Promise.resolve(undefined)
        },
      }),
    }),
  },
}))

vi.mock('@/db/schema', () => ({
  lectures: { __table: 'lectures' },
  lectureFeedback: { __table: 'lectureFeedback' },
  studentAttendances: { __table: 'studentAttendances' },
  zefLmsMetaData: { __table: 'zefLmsMetaData' },
  zefLmsFeedbackSubmissions: { __table: 'zefLmsFeedbackSubmissions' },
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const now = new Date().toISOString()
const wayPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

function openLectureRow(showFeedback = 1) {
  return {
    schedule: past,
    concludes: now,
    settings: { show_feedback: showFeedback },
    sectionId: 2,
  }
}

function longClosedLectureRow() {
  return {
    schedule: wayPast,
    concludes: wayPast,
    settings: { show_feedback: 1 },
    sectionId: 2,
  }
}

describe('lectureFeedback.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.insertCalls = []
    hoisted.updateCalls = []
    hoisted.ensureAccess.mockResolvedValue(true)
  })

  describe('getLectureFeedbackRecord', () => {
    it('zef mode: returns the saved rating, message and tags when meta exists and caller says attended', async () => {
      // [meta lookup, zef submission lookup] — no attendance query: the
      // caller (getLectureLearningDetailForUser) already supplies `attended`
      // from the same summary that renders the "Present" badge.
      hoisted.selectQueue = [
        [{ id: 55 }],
        [
          {
            rating: 4,
            message: 'Great session',
            followupTags: ['Great examples', 'Very engaging'],
          },
        ],
      ]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, true)).resolves.toEqual({
        mode: 'zef',
        rating: 4,
        text: 'Great session',
        tags: ['Great examples', 'Very engaging'],
      })
    })

    it('zef mode: nulls when a meta row exists but no submission yet', async () => {
      hoisted.selectQueue = [[{ id: 55 }], []]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, true)).resolves.toEqual({
        mode: 'zef',
        rating: null,
        text: null,
        tags: [],
      })
    })

    it('hidden mode: meta row exists but caller says not attended -> no feedback at all, never a legacy read', async () => {
      // Only the meta lookup runs; `lecture_feedback` is never consulted, so a
      // stale legacy row for a ZEF-owned lecture can't leak back into the UI.
      hoisted.selectQueue = [[{ id: 55 }], [{ rating: 2, feedback: 'meh' }]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, false)).resolves.toEqual({
        mode: 'hidden',
        rating: null,
        text: null,
        tags: [],
      })
    })

    it('legacy mode: no meta row and not attended -> still reads lecture_feedback', async () => {
      // [meta lookup (none), lecture_feedback lookup]
      hoisted.selectQueue = [[], [{ rating: 2, feedback: 'meh' }]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, false)).resolves.toEqual({
        mode: 'legacy',
        rating: 2,
        text: 'meh',
        tags: [],
      })
    })

    it('legacy mode: attended but no meta row -> reads lecture_feedback', async () => {
      // [meta lookup (none), lecture_feedback lookup]
      hoisted.selectQueue = [[], [{ rating: 3, feedback: 'ok' }]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, true)).resolves.toEqual({
        mode: 'legacy',
        rating: 3,
        text: 'ok',
        tags: [],
      })
    })

    it('legacy mode: nulls when neither meta nor lecture_feedback rows exist', async () => {
      hoisted.selectQueue = [[], []]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572, true)).resolves.toEqual({
        mode: 'legacy',
        rating: null,
        text: null,
        tags: [],
      })
    })
  })

  describe('submitLectureFeedback', () => {
    it('zef mode: inserts into zef_lms_feedback_submissions and ignores the window entirely', async () => {
      // [lecture row (window long closed), meta lookup (exists), attendance lookup (attended)]
      hoisted.selectQueue = [
        [longClosedLectureRow()],
        [{ id: 55 }],
        [{ id: 1 }],
      ]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      const result = await submitLectureFeedback({
        userId: 7,
        lectureId: 572,
        rating: 5,
        text: 'Loved it',
        tags: ['Great examples'],
      })

      expect(result).toEqual({
        mode: 'zef',
        rating: 5,
        text: 'Loved it',
        tags: ['Great examples'],
      })
      expect(hoisted.insertCalls).toHaveLength(1)
      expect(hoisted.insertCalls[0].table).toEqual({
        __table: 'zefLmsFeedbackSubmissions',
      })
      expect(hoisted.insertCalls[0].values).toMatchObject({
        zefLmsMetaDataId: 55,
        userId: 7,
        rating: 5,
        message: 'Loved it',
        followupTags: ['Great examples'],
        source: 'lms',
      })
      expect(hoisted.updateCalls).toHaveLength(0)
    })

    it('rejects when a meta row exists but the user did not attend — no legacy fallback write', async () => {
      // [lecture row, meta lookup (exists), attendance lookup (none)]
      hoisted.selectQueue = [[openLectureRow()], [{ id: 55 }], []]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await expect(
        submitLectureFeedback({
          userId: 7,
          lectureId: 572,
          rating: 5,
          text: 'Loved it',
          tags: ['Great examples'],
        }),
      ).rejects.toThrow('FEEDBACK_NOT_AVAILABLE')
      expect(hoisted.insertCalls).toHaveLength(0)
      expect(hoisted.updateCalls).toHaveLength(0)
    })

    it('legacy mode: no meta row, window open -> inserts into lecture_feedback', async () => {
      // [lecture row, meta lookup (none), existing-feedback lookup (none)]
      hoisted.selectQueue = [[openLectureRow()], [], []]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      const result = await submitLectureFeedback({
        userId: 7,
        lectureId: 572,
        rating: 5,
        text: 'Loved it',
        tags: ['Great examples'],
      })

      expect(result).toEqual({
        mode: 'legacy',
        rating: 5,
        text: 'Loved it',
        tags: [],
      })
      expect(hoisted.insertCalls).toHaveLength(1)
      expect(hoisted.insertCalls[0].table).toEqual({
        __table: 'lectureFeedback',
      })
      expect(hoisted.insertCalls[0].values).toMatchObject({
        lectureId: 572,
        userId: 7,
        rating: 5,
        feedback: 'Loved it',
      })
      expect(hoisted.updateCalls).toHaveLength(0)
    })

    it('legacy mode: no meta row, existing lecture_feedback row -> updates it', async () => {
      hoisted.selectQueue = [[openLectureRow()], [], [{ id: 11 }]]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await submitLectureFeedback({
        userId: 7,
        lectureId: 572,
        rating: 3,
        text: null,
        tags: [],
      })

      expect(hoisted.updateCalls).toHaveLength(1)
      expect(hoisted.updateCalls[0].table).toEqual({
        __table: 'lectureFeedback',
      })
      expect(hoisted.updateCalls[0].set).toMatchObject({
        rating: 3,
        feedback: null,
      })
      expect(hoisted.insertCalls).toHaveLength(0)
    })

    it('legacy mode: no meta row, window closed -> throws', async () => {
      hoisted.selectQueue = [[openLectureRow(0)], []]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await expect(
        submitLectureFeedback({
          userId: 7,
          lectureId: 572,
          rating: 5,
          text: null,
          tags: [],
        }),
      ).rejects.toThrow('FEEDBACK_WINDOW_CLOSED')
      expect(hoisted.insertCalls).toHaveLength(0)
    })

    it('throws when the lecture is missing', async () => {
      hoisted.selectQueue = [[]]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await expect(
        submitLectureFeedback({
          userId: 7,
          lectureId: 1,
          rating: 5,
          text: null,
          tags: [],
        }),
      ).rejects.toThrow('LEARN_DETAIL_NOT_FOUND')
    })

    it('throws when the user cannot access the lecture', async () => {
      hoisted.selectQueue = [[openLectureRow()]]
      hoisted.ensureAccess.mockResolvedValueOnce(false)
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await expect(
        submitLectureFeedback({
          userId: 7,
          lectureId: 572,
          rating: 5,
          text: null,
          tags: [],
        }),
      ).rejects.toThrow('LEARN_DETAIL_NOT_FOUND')
    })
  })
})
