import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchLectureTranscriptFromCache } from '../lectureTranscriptApi'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'

vi.mock('@/lib/api/fetchJson', () => ({ fetchJson: vi.fn() }))

const url = '/api/cache/transcript/12/34/7'

describe('fetchLectureTranscriptFromCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the transcript payload', async () => {
    const payload = {
      lectureId: 7,
      segments: [{ id: 1, start: 0, end: 2, text: 'Hi' }],
      text: null,
    }
    vi.mocked(fetchJson).mockResolvedValue(payload)

    await expect(fetchLectureTranscriptFromCache(url)).resolves.toEqual(payload)
    expect(fetchJson).toHaveBeenCalledWith(url)
  })

  it('treats a 404 as "no transcript" rather than a failure', async () => {
    vi.mocked(fetchJson).mockRejectedValue(
      new ApiClientError(404, { code: 'LECTURE_TRANSCRIPT_NOT_FOUND' }),
    )

    await expect(fetchLectureTranscriptFromCache(url)).resolves.toEqual({
      lectureId: 0,
      segments: [],
      text: null,
    })
  })

  it('propagates other failures so the caller can show an error', async () => {
    vi.mocked(fetchJson).mockRejectedValue(
      new ApiClientError(500, { code: 'INTERNAL_SERVER_ERROR' }),
    )

    await expect(fetchLectureTranscriptFromCache(url)).rejects.toThrow(
      ApiClientError,
    )
  })
})
