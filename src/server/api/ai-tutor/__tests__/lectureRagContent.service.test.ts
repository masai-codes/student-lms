import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/db/schema', () => ({
  lectures: {
    id: 'lectures.id',
    notes: 'lectures.notes',
    batchId: 'lectures.batchId',
    sectionId: 'lectures.sectionId',
  },
}))

function lectureSelectChain(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(row ? [row] : []),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLectureRagContent', () => {
  it('throws when the lecture does not exist', async () => {
    hoisted.dbSelect.mockReturnValueOnce(lectureSelectChain(null))

    const { getLectureRagContent } = await import(
      '../services/lectureRagContent.service'
    )
    await expect(getLectureRagContent(99)).rejects.toMatchObject({
      code: 'AI_TUTOR_LECTURE_NOT_FOUND',
    })
  })

  it('throws when notes are empty', async () => {
    hoisted.dbSelect.mockReturnValueOnce(
      lectureSelectChain({ notes: '   ', batchId: 1, sectionId: 2 }),
    )

    const { getLectureRagContent } = await import(
      '../services/lectureRagContent.service'
    )
    await expect(getLectureRagContent(12)).rejects.toMatchObject({
      code: 'AI_TUTOR_NOTES_NOT_FOUND',
    })
  })

  it('returns trimmed notes with lecture metadata', async () => {
    hoisted.dbSelect.mockReturnValueOnce(
      lectureSelectChain({ notes: '  Notes body  ', batchId: 4, sectionId: 5 }),
    )

    const { getLectureRagContent } = await import(
      '../services/lectureRagContent.service'
    )
    await expect(getLectureRagContent(12)).resolves.toEqual({
      lectureId: 12,
      notes: 'Notes body',
      batchId: 4,
      sectionId: 5,
    })
  })
})
