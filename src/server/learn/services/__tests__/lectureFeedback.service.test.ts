import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  insertValues: vi.fn(),
  updateWhere: vi.fn(),
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
    insert: () => ({ values: hoisted.insertValues }),
    update: () => ({ set: () => ({ where: hoisted.updateWhere }) }),
  },
}))

vi.mock('@/db/schema', () => ({ lectureFeedback: {}, lectures: {} }))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const now = new Date().toISOString()

function openLectureRow(showFeedback = 1) {
  return {
    schedule: past,
    concludes: now,
    settings: { show_feedback: showFeedback },
    batchId: 1,
    sectionId: 2,
  }
}

describe('lectureFeedback.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    hoisted.insertValues.mockResolvedValue(undefined)
    hoisted.updateWhere.mockResolvedValue(undefined)
    hoisted.ensureAccess.mockResolvedValue(true)
  })

  describe('getLectureFeedbackRecord', () => {
    it('returns nulls when no row exists', async () => {
      hoisted.selectQueue = [[]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572)).resolves.toEqual({
        rating: null,
        text: null,
      })
    })

    it('returns the saved rating and feedback', async () => {
      hoisted.selectQueue = [[{ rating: 4, feedback: 'Great session' }]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572)).resolves.toEqual({
        rating: 4,
        text: 'Great session',
      })
    })

    it('treats a 0 rating as not-yet-rated', async () => {
      hoisted.selectQueue = [[{ rating: 0, feedback: null }]]
      const { getLectureFeedbackRecord } =
        await import('../lectureFeedback.service')

      await expect(getLectureFeedbackRecord(7, 572)).resolves.toEqual({
        rating: null,
        text: null,
      })
    })
  })

  describe('submitLectureFeedback', () => {
    it('inserts feedback when none exists and the window is open', async () => {
      // [lecture row, existing-feedback lookup (none)]
      hoisted.selectQueue = [[openLectureRow()], []]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      const result = await submitLectureFeedback({
        userId: 7,
        lectureId: 572,
        rating: 5,
        text: 'Loved it',
      })

      expect(result).toEqual({ rating: 5, text: 'Loved it' })
      expect(hoisted.insertValues).toHaveBeenCalledTimes(1)
      expect(hoisted.updateWhere).not.toHaveBeenCalled()
    })

    it('updates feedback when a row already exists', async () => {
      hoisted.selectQueue = [[openLectureRow()], [{ id: 11 }]]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await submitLectureFeedback({
        userId: 7,
        lectureId: 572,
        rating: 3,
        text: null,
      })

      expect(hoisted.updateWhere).toHaveBeenCalledTimes(1)
      expect(hoisted.insertValues).not.toHaveBeenCalled()
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
        }),
      ).rejects.toThrow('LEARN_DETAIL_NOT_FOUND')
    })

    it('throws when the feedback window is closed', async () => {
      hoisted.selectQueue = [[openLectureRow(0)]]
      const { submitLectureFeedback } =
        await import('../lectureFeedback.service')

      await expect(
        submitLectureFeedback({
          userId: 7,
          lectureId: 572,
          rating: 5,
          text: null,
        }),
      ).rejects.toThrow('FEEDBACK_WINDOW_CLOSED')
    })
  })
})
