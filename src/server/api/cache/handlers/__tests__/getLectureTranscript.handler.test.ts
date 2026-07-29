import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleGetCachedLectureTranscript } from '../getLectureTranscript.handler'
import { getCachedLectureTranscript } from '@/server/api/cache/getLectureTranscript.service'
import { ApiError } from '@/server/api/http/apiError'

vi.mock('@/server/api/cache/getLectureTranscript.service', () => ({
  getCachedLectureTranscript: vi.fn(),
}))

const params = { batchId: '12', sectionId: '34', lectureId: '7' }

describe('getLectureTranscript.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves the transcript with an edge-cacheable Cache-Control header', async () => {
    vi.mocked(getCachedLectureTranscript).mockResolvedValue({
      lectureId: 7,
      segments: [{ id: 1, start: 0, end: 2, text: 'Hi' }],
      text: null,
    })

    const res = await handleGetCachedLectureTranscript(params)

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=3600, s-maxage=86400, immutable',
    )
    await expect(res.json()).resolves.toMatchObject({ lectureId: 7 })
    expect(getCachedLectureTranscript).toHaveBeenCalledWith({
      batchId: 12,
      sectionId: 34,
      lectureId: 7,
    })
  })

  it('never caches a missing transcript at the edge', async () => {
    vi.mocked(getCachedLectureTranscript).mockRejectedValue(
      new ApiError(404, 'LECTURE_TRANSCRIPT_NOT_FOUND'),
    )

    const res = await handleGetCachedLectureTranscript(params)

    // 404 travels as 422 past CloudFront's custom error responses.
    expect(res.status).toBe(422)
    expect(res.headers.get('x-true-status')).toBe('404')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it.each([
    ['batchId', { ...params, batchId: '0' }, 'INVALID_BATCH_ID'],
    ['sectionId', { ...params, sectionId: 'abc' }, 'INVALID_SECTION_ID'],
    ['lectureId', { ...params, lectureId: '-1' }, 'INVALID_LECTURE_ID'],
  ])('rejects an invalid %s without hitting the DB', async (_l, bad, code) => {
    const res = await handleGetCachedLectureTranscript(bad)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ code })
    expect(getCachedLectureTranscript).not.toHaveBeenCalled()
  })
})
