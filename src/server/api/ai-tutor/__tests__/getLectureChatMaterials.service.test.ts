import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  isRagPlatformConfigured: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/db/schema', () => ({
  lectures: { id: 'lectures.id', notes: 'lectures.notes', data: 'lectures.data' },
  lecturesAi: { lectureId: 'lecturesAi.lectureId', summary: 'lecturesAi.summary' },
}))

vi.mock('@/server/api/ai-tutor/clients/ragPlatform', () => ({
  isRagPlatformConfigured: hoisted.isRagPlatformConfigured,
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
  hoisted.isRagPlatformConfigured.mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getLectureChatMaterials', () => {
  it('throws when the lecture does not exist', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(lectureSelectChain(null))
      .mockReturnValueOnce(lectureSelectChain(null))

    const { getLectureChatMaterials } = await import(
      '../services/getLectureChatMaterials.service'
    )
    await expect(getLectureChatMaterials(9)).rejects.toMatchObject({
      code: 'AI_TUTOR_LECTURE_NOT_FOUND',
    })
  })

  it('inlines notes and disables retrieval when notesRagged is false', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(
        lectureSelectChain({ notes: 'Short notes', data: { notesRagged: false } }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: 'Lecture summary' }))

    const { getLectureChatMaterials } = await import(
      '../services/getLectureChatMaterials.service'
    )
    await expect(getLectureChatMaterials(12)).resolves.toEqual({
      lectureId: 12,
      summary: 'Lecture summary',
      notesRagged: false,
      notesInline: 'Short notes',
      notesOutline: null,
      notesCharacterCount: 11,
      ragRetrievalAvailable: false,
    })
  })

  it('uses notesToc and enables retrieval when notesRagged is true', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(
        lectureSelectChain({
          notes: 'Long notes body',
          data: { notesRagged: true, notesToc: '- Arrays\n- Sorting' },
        }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: null }))

    const { getLectureChatMaterials } = await import(
      '../services/getLectureChatMaterials.service'
    )
    const materials = await getLectureChatMaterials(12)

    expect(materials).toEqual({
      lectureId: 12,
      summary: null,
      notesRagged: true,
      notesInline: null,
      notesOutline: '- Arrays\n- Sorting',
      notesCharacterCount: 15,
      ragRetrievalAvailable: true,
    })
  })

  it('defaults to inline notes when notesRagged is missing', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(lectureSelectChain({ notes: 'Inline notes', data: {} }))
      .mockReturnValueOnce(lectureSelectChain({ summary: null }))

    const { getLectureChatMaterials } = await import(
      '../services/getLectureChatMaterials.service'
    )
    const materials = await getLectureChatMaterials(12)

    expect(materials.notesRagged).toBe(false)
    expect(materials.notesInline).toBe('Inline notes')
    expect(materials.ragRetrievalAvailable).toBe(false)
  })
})
