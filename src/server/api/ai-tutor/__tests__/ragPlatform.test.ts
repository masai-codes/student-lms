import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.RAG_PLATFORM_BASE_URL = 'http://rag.local/'
  process.env.RAG_PLATFORM_API_KEY = 'rag-key'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('ragPlatform', () => {
  it('throws when RAG platform env is missing', async () => {
    delete process.env.RAG_PLATFORM_BASE_URL
    const { ensureRagPlatformConfigured } = await import('../clients/ragPlatform')
    expect(() => ensureRagPlatformConfigured()).toThrowError(
      expect.objectContaining({ code: 'AI_TUTOR_RAG_PLATFORM_NOT_CONFIGURED' }),
    )
  })

  it('uses the default collection name when env is unset', async () => {
    delete process.env.RAG_PLATFORM_COLLECTION_NAME
    const { getRagPlatformCollectionName } = await import('../clients/ragPlatform')
    expect(getRagPlatformCollectionName()).toBe('student-lms-ai-tutor')
  })

  it('creates a collection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const { ensureRagCollection } = await import('../clients/ragPlatform')
    await ensureRagCollection('student-lms-ai-tutor')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://rag.local/collections')
    expect((init.headers as Record<string, string>)['X-API-KEY']).toBe('rag-key')
    expect(JSON.parse(String(init.body))).toEqual({
      collection_name: 'student-lms-ai-tutor',
    })
  })

  it('swallows 404 when deleting a missing document', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', fetchMock)

    const { deleteRagDocument } = await import('../clients/ragPlatform')
    await expect(deleteRagDocument('lecture-1-notes')).resolves.toBeUndefined()
  })

  it('throws when delete fails with a non-404 status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' })
    vi.stubGlobal('fetch', fetchMock)

    const { deleteRagDocument } = await import('../clients/ragPlatform')
    await expect(deleteRagDocument('lecture-1-notes')).rejects.toMatchObject({
      code: 'AI_TUTOR_RAG_PLATFORM_REQUEST_FAILED',
    })
  })

  it('ingests text and returns the job response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job_id: 'job-1', status: 'PENDING' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { ingestRagText } = await import('../clients/ragPlatform')
    const result = await ingestRagText({
      collectionName: 'student-lms-ai-tutor',
      documentId: 'lecture-9-notes',
      documentName: 'lecture-9-notes',
      text: 'Notes body',
      metadata: { lecture_id: 9, source_type: 'notes' },
    })

    expect(result).toEqual({ job_id: 'job-1', status: 'PENDING' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://rag.local/api/v1/ingestion/text')
    expect(JSON.parse(String(init.body))).toEqual({
      collection_name: 'student-lms-ai-tutor',
      document_name: 'lecture-9-notes',
      document_id: 'lecture-9-notes',
      text: 'Notes body',
      metadata: { lecture_id: 9, source_type: 'notes' },
    })
  })

  it('throws when ingest request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 422, text: async () => 'invalid' })
    vi.stubGlobal('fetch', fetchMock)

    const { ingestRagText } = await import('../clients/ragPlatform')
    await expect(
      ingestRagText({
        collectionName: 'student-lms-ai-tutor',
        documentId: 'lecture-9-notes',
        documentName: 'lecture-9-notes',
        text: 'Notes body',
        metadata: { lecture_id: 9, source_type: 'notes' },
      }),
    ).rejects.toMatchObject({ code: 'AI_TUTOR_RAG_PLATFORM_REQUEST_FAILED' })
  })

  it('retrieves chunks for a lecture query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: 'Explain arrays',
        chunks: [
          {
            chunk_id: 'c1',
            document_id: 'd1',
            score: 0.9,
            content: 'Array notes',
            metadata: { lecture_id: 12, source_type: 'notes' },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { retrieveRagChunks } = await import('../clients/ragPlatform')
    const result = await retrieveRagChunks({
      collectionName: 'student-lms-ai-tutor',
      query: 'Explain arrays',
      topK: 6,
      metadataFilters: { lecture_id: 12 },
    })

    expect(result.chunks).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://rag.local/api/v1/retrieve')
    expect(JSON.parse(String(init.body))).toEqual({
      collection_name: 'student-lms-ai-tutor',
      query: 'Explain arrays',
      top_k: 6,
      metadata_filters: { lecture_id: 12 },
    })
  })
})
