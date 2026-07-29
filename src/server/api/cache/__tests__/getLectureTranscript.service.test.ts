import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCachedLectureTranscript } from '../getLectureTranscript.service'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

type TranscriptRow = {
  transcript: string | null
  transcriptSegments: unknown
}

function mockRows(rows: Array<TranscriptRow>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      innerJoin: () => ({
        where: () => ({ limit: () => Promise.resolve(rows) }),
      }),
    }),
  })
}

const ids = { batchId: 12, sectionId: 34, lectureId: 7 }

describe('getCachedLectureTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed segments and omits the duplicate plain text', async () => {
    mockRows([
      {
        transcript: 'Hello there Welcome to class',
        transcriptSegments: JSON.stringify([
          { id: 1, start: 0, end: 4.5, text: 'Hello there' },
          { id: 2, start: 4.5, end: 9, text: 'Welcome to class' },
        ]),
      },
    ])

    await expect(getCachedLectureTranscript(ids)).resolves.toEqual({
      lectureId: 7,
      segments: [
        { id: 1, start: 0, end: 4.5, text: 'Hello there' },
        { id: 2, start: 4.5, end: 9, text: 'Welcome to class' },
      ],
      text: null,
    })
  })

  it('falls back to plain text when no segments were produced', async () => {
    mockRows([{ transcript: '  Full transcript  ', transcriptSegments: null }])

    await expect(getCachedLectureTranscript(ids)).resolves.toEqual({
      lectureId: 7,
      segments: [],
      text: 'Full transcript',
    })
  })

  it('404s when the batch/section/lecture triple matches no lecture', async () => {
    mockRows([])

    await expect(getCachedLectureTranscript(ids)).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_TRANSCRIPT_NOT_FOUND',
    })
  })

  it('404s rather than caching an empty transcript', async () => {
    mockRows([{ transcript: '   ', transcriptSegments: [] }])

    await expect(getCachedLectureTranscript(ids)).rejects.toMatchObject({
      status: 404,
      code: 'LECTURE_TRANSCRIPT_NOT_FOUND',
    })
  })
})
