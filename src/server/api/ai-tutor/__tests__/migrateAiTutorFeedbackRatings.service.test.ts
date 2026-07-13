import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  aiChatPracticeQuestions: {
    id: 'ai_chat_practice_questions.id',
    rating: 'ai_chat_practice_questions.rating',
    feedback: 'ai_chat_practice_questions.feedback',
    updatedAt: 'ai_chat_practice_questions.updated_at',
  },
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => Promise.resolve(rows) }),
  }
}

function mockUpdate() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn().mockReturnValue({ where })
  hoisted.dbUpdate.mockReturnValue({ set })
  return { set, where }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('migrateAiTutorFeedbackRatings', () => {
  it('updates matching rows and reports dry-run without writing', async () => {
    const { migrateAiTutorFeedbackRatings } =
      await import('../migrateAiTutorFeedbackRatings.service')

    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { id: 1, rating: 6, feedback: 'ios' },
        { id: 2, rating: 1, feedback: null },
        { id: 3, rating: 4, feedback: 'legacy' },
      ]),
    )

    const result = await migrateAiTutorFeedbackRatings({ dryRun: true })

    expect(result).toMatchObject({
      dryRun: true,
      scanned: 3,
      updated: 2,
      unchanged: 1,
      skipped: 0,
      changes: [
        { id: 1, previousRating: 6, rating: 5 },
        { id: 2, previousRating: 1, rating: 5 },
      ],
    })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('persists updates when dryRun is false', async () => {
    const { migrateAiTutorFeedbackRatings } =
      await import('../migrateAiTutorFeedbackRatings.service')

    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ id: 9, rating: 2, feedback: 'android' }]),
    )
    const update = mockUpdate()

    const result = await migrateAiTutorFeedbackRatings({ dryRun: false })

    expect(result.updated).toBe(1)
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 1 }),
    )
    expect(update.where).toHaveBeenCalled()
  })

  it('reports skipped mobile rows', async () => {
    const { migrateAiTutorFeedbackRatings } =
      await import('../migrateAiTutorFeedbackRatings.service')

    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ id: 4, rating: 1, feedback: 'ios' }]),
    )

    const result = await migrateAiTutorFeedbackRatings({ dryRun: true })

    expect(result.skipped).toBe(1)
    expect(result.skippedRows).toEqual([
      { id: 4, rating: 1, reason: 'MOBILE_RATING_BELOW_MIN' },
    ])
  })
})
