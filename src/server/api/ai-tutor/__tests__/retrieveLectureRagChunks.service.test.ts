import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  isRagPlatformConfigured: vi.fn(),
  getRagPlatformCollectionName: vi.fn(),
  retrieveRagChunks: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/clients/ragPlatform', () => ({
  isRagPlatformConfigured: hoisted.isRagPlatformConfigured,
  getRagPlatformCollectionName: hoisted.getRagPlatformCollectionName,
  retrieveRagChunks: hoisted.retrieveRagChunks,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.isRagPlatformConfigured.mockReturnValue(true)
  hoisted.getRagPlatformCollectionName.mockReturnValue('student-lms-ai-tutor')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('retrieveLectureRagChunksByQuery', () => {
  it('skips retrieval when the RAG platform is not configured', async () => {
    hoisted.isRagPlatformConfigured.mockReturnValueOnce(false)
    const { retrieveLectureRagChunksByQuery } =
      await import('../services/retrieveLectureRagChunks.service')

    await expect(
      retrieveLectureRagChunksByQuery({
        lectureId: 12,
        query: 'heap sort',
        topK: 4,
      }),
    ).resolves.toEqual([])
  })

  it('retrieves chunks using the provided query and top_k', async () => {
    hoisted.retrieveRagChunks.mockResolvedValueOnce({
      query: 'heap sort',
      chunks: [
        {
          chunk_id: 'c1',
          document_id: 'd1',
          score: 0.95,
          content: 'Heap sort uses a heap.',
          metadata: { source_type: 'transcript', lecture_id: 12 },
          document_name: 'lecture-12-transcript',
        },
      ],
    })

    const { retrieveLectureRagChunksByQuery } =
      await import('../services/retrieveLectureRagChunks.service')
    const chunks = await retrieveLectureRagChunksByQuery({
      lectureId: 12,
      query: 'heap sort',
      topK: 4,
    })

    expect(hoisted.retrieveRagChunks).toHaveBeenCalledWith({
      collectionName: 'student-lms-ai-tutor',
      query: 'heap sort',
      topK: 4,
      metadataFilters: { lecture_id: 12 },
    })
    expect(chunks).toEqual([
      {
        content: 'Heap sort uses a heap.',
        sourceType: 'transcript',
        documentName: 'lecture-12-transcript',
        score: 0.95,
      },
    ])
  })
})

describe('retrieveLectureRagChunksForTool', () => {
  it('returns formatted chunk text for the model', async () => {
    hoisted.retrieveRagChunks.mockResolvedValueOnce({
      query: 'arrays',
      chunks: [
        {
          chunk_id: 'c1',
          document_id: 'd1',
          score: 0.9,
          content: 'Arrays store elements in order.',
          metadata: { source_type: 'notes' },
          document_name: 'lecture-12-notes',
        },
      ],
    })

    const { retrieveLectureRagChunksForTool } =
      await import('../services/retrieveLectureRagChunks.service')

    await expect(
      retrieveLectureRagChunksForTool({
        lectureId: 12,
        query: 'arrays',
        topK: 3,
      }),
    ).resolves.toBe('[notes · score 0.90]\nArrays store elements in order.')
  })
})
