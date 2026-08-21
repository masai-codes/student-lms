import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  isRagPlatformConfigured: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/db/schema', () => ({
  lectures: {
    id: 'lectures.id',
    title: 'lectures.title',
    notes: 'lectures.notes',
    data: 'lectures.data',
  },
  lecturesAi: {
    lectureId: 'lecturesAi.lectureId',
    summary: 'lecturesAi.summary',
  },
  lectureZoomChat: {
    lectureId: 'lectureZoomChat.lectureId',
    finalChat: 'lectureZoomChat.finalChat',
  },
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
      .mockReturnValueOnce(lectureSelectChain(null))

    const { getLectureChatMaterials } =
      await import('../services/getLectureChatMaterials.service')
    await expect(getLectureChatMaterials(9)).rejects.toMatchObject({
      code: 'AI_TUTOR_LECTURE_NOT_FOUND',
    })
  })

  it('inlines notes and disables retrieval when notesRagged is false', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(
        lectureSelectChain({
          title: 'React Hooks',
          notes: 'Short notes',
          data: { notesRagged: false },
        }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: 'Lecture summary' }))
      .mockReturnValueOnce(lectureSelectChain({ finalChat: null }))

    const { getLectureChatMaterials } =
      await import('../services/getLectureChatMaterials.service')
    await expect(getLectureChatMaterials(12)).resolves.toEqual({
      lectureId: 12,
      title: 'React Hooks',
      summary: 'Lecture summary',
      resourcesShared: [],
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
          title: 'Sorting Algorithms',
          notes: 'Long notes body',
          data: { notesRagged: true, notesToc: '- Arrays\n- Sorting' },
        }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: null }))
      .mockReturnValueOnce(lectureSelectChain({ finalChat: null }))

    const { getLectureChatMaterials } =
      await import('../services/getLectureChatMaterials.service')
    const materials = await getLectureChatMaterials(12)

    expect(materials).toEqual({
      lectureId: 12,
      title: 'Sorting Algorithms',
      summary: null,
      resourcesShared: [],
      notesRagged: true,
      notesInline: null,
      notesOutline: '- Arrays\n- Sorting',
      notesCharacterCount: 15,
      ragRetrievalAvailable: true,
    })
  })

  it('defaults to inline notes when notesRagged is missing', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(
        lectureSelectChain({ title: 'Intro', notes: 'Inline notes', data: {} }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: null }))
      .mockReturnValueOnce(lectureSelectChain(null))

    const { getLectureChatMaterials } =
      await import('../services/getLectureChatMaterials.service')
    const materials = await getLectureChatMaterials(12)

    expect(materials.notesRagged).toBe(false)
    expect(materials.notesInline).toBe('Inline notes')
    expect(materials.ragRetrievalAvailable).toBe(false)
    expect(materials.resourcesShared).toEqual([])
  })

  it('parses shared resources from lecture zoom chat final_chat', async () => {
    hoisted.dbSelect
      .mockReturnValueOnce(
        lectureSelectChain({ title: 'Live Session', notes: 'Notes', data: {} }),
      )
      .mockReturnValueOnce(lectureSelectChain({ summary: 'Summary' }))
      .mockReturnValueOnce(
        lectureSelectChain({
          finalChat: [
            {
              url: 'https://example.com/resource',
              count: 1,
              posted_by: 'Divyasri',
              timestamp: '00:51:47',
              resolved_to: null,
            },
          ],
        }),
      )

    const { getLectureChatMaterials } =
      await import('../services/getLectureChatMaterials.service')
    const materials = await getLectureChatMaterials(12)

    expect(materials.resourcesShared).toEqual([
      {
        url: 'https://example.com/resource',
        count: 1,
        postedBy: 'Divyasri',
        timestamp: '00:51:47',
        resolvedTo: null,
      },
    ])
  })
})
