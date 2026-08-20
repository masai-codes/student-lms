import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  ingestLectureRag: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/ingestLectureRag.service', () => ({
  ingestLectureRag: hoisted.ingestLectureRag,
}))

const ORIGINAL_ENV = { ...process.env }

function getRequest(
  lectureId: string,
  secret: string | null = 'sekret',
): Request {
  return new Request(
    `http://localhost/api/ai-tutor/lectures/${lectureId}/ingest`,
    {
      method: 'GET',
      headers: secret ? { 'x-ai-tutor-rag-ingest-secret': secret } : {},
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AI_TUTOR_RAG_INGEST_SECRET = 'sekret'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
})

describe('handleIngestLectureRag', () => {
  it('returns 503 when ingest secret env is missing', async () => {
    delete process.env.AI_TUTOR_RAG_INGEST_SECRET
    const { handleIngestLectureRag } =
      await import('../handlers/ingestLectureRag.handler')

    const res = await handleIngestLectureRag(getRequest('12'), '12')

    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_RAG_INGEST_NOT_CONFIGURED',
    })
  })

  it('returns 401 when the secret header is missing or wrong', async () => {
    const { handleIngestLectureRag } =
      await import('../handlers/ingestLectureRag.handler')

    const missing = await handleIngestLectureRag(getRequest('12', null), '12')
    expect(missing.status).toBe(401)
    await expect(missing.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_RAG_INGEST_FORBIDDEN',
    })

    const wrong = await handleIngestLectureRag(getRequest('12', 'nope'), '12')
    expect(wrong.status).toBe(401)
  })

  it('returns 400 for an invalid lecture id', async () => {
    const { handleIngestLectureRag } =
      await import('../handlers/ingestLectureRag.handler')

    const res = await handleIngestLectureRag(getRequest('0'), '0')

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_LECTURE_ID_INVALID',
    })
  })

  it('returns ingestion jobs for a valid request', async () => {
    const { handleIngestLectureRag } =
      await import('../handlers/ingestLectureRag.handler')
    hoisted.ingestLectureRag.mockResolvedValueOnce({
      lectureId: 12,
      notesRagged: true,
      notesCharacterCount: 15_000,
      notesToc: '- Arrays',
      collectionName: 'student-lms-ai-tutor',
      jobs: [
        {
          sourceType: 'notes',
          documentId: 'lecture-12-notes',
          documentName: 'lecture-12-notes',
          jobId: 'job-1',
          status: 'PENDING',
        },
      ],
    })

    const res = await handleIngestLectureRag(getRequest('12'), '12')

    expect(res.status).toBe(200)
    expect(hoisted.ingestLectureRag).toHaveBeenCalledWith(12)
    await expect(res.json()).resolves.toMatchObject({
      lectureId: 12,
      notesRagged: true,
      notesToc: '- Arrays',
      jobs: [{ jobId: 'job-1' }],
    })
  })

  it('maps unexpected service failures to 500', async () => {
    const { handleIngestLectureRag } =
      await import('../handlers/ingestLectureRag.handler')
    hoisted.ingestLectureRag.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await handleIngestLectureRag(getRequest('12'), '12')

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_INGESTING_LECTURE_RAG',
    })
    expect(errorSpy).toHaveBeenCalled()
  })
})
