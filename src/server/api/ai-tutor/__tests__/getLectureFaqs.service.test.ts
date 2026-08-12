import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/db/schema', () => ({
  lecturesAi: {
    lectureId: 'lecturesAi.lectureId',
    faqs: 'lecturesAi.faqs',
  },
}))

function selectChain(row: Record<string, unknown> | null) {
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

describe('getLectureFaqs', () => {
  it('returns an empty list when the lecture has no ai row', async () => {
    hoisted.dbSelect.mockReturnValueOnce(selectChain(null))

    const { getLectureFaqs } =
      await import('../services/getLectureFaqs.service')
    await expect(getLectureFaqs(1)).resolves.toEqual([])
  })

  it('returns an empty list when faqs is null', async () => {
    hoisted.dbSelect.mockReturnValueOnce(selectChain({ faqs: null }))

    const { getLectureFaqs } =
      await import('../services/getLectureFaqs.service')
    await expect(getLectureFaqs(1)).resolves.toEqual([])
  })

  it('parses faqs from the dedicated json column', async () => {
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain({
        faqs: [{ question: 'What is X?', answer: 'X is Y.' }],
      }),
    )

    const { getLectureFaqs } =
      await import('../services/getLectureFaqs.service')
    await expect(getLectureFaqs(1)).resolves.toEqual([
      { question: 'What is X?', answer: 'X is Y.' },
    ])
  })
})
