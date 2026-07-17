import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  ensureRagPlatformConfigured: vi.fn(),
  ensureRagCollection: vi.fn(),
  deleteRagDocument: vi.fn(),
  ingestRagText: vi.fn(),
  getRagPlatformCollectionName: vi.fn(),
  getLectureRagContent: vi.fn(),
  generateLectureNotesTocFromMarkdown: vi.fn(),
  saveLectureNotesRagStatus: vi.fn(),
}))

vi.mock('@/server/api/ai-tutor/clients/ragPlatform', () => ({
  ensureRagPlatformConfigured: hoisted.ensureRagPlatformConfigured,
  ensureRagCollection: hoisted.ensureRagCollection,
  deleteRagDocument: hoisted.deleteRagDocument,
  ingestRagText: hoisted.ingestRagText,
  getRagPlatformCollectionName: hoisted.getRagPlatformCollectionName,
}))

vi.mock('@/server/api/ai-tutor/services/lectureRagContent.service', () => ({
  getLectureRagContent: hoisted.getLectureRagContent,
}))

vi.mock('@/server/api/ai-tutor/services/generateLectureNotesTocFromMarkdown', () => ({
  generateLectureNotesTocFromMarkdown: hoisted.generateLectureNotesTocFromMarkdown,
}))

vi.mock('@/server/api/ai-tutor/services/lectureNotesTocStorage.service', () => ({
  saveLectureNotesRagStatus: hoisted.saveLectureNotesRagStatus,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getRagPlatformCollectionName.mockReturnValue('student-lms-ai-tutor')
  hoisted.ensureRagCollection.mockResolvedValue(undefined)
  hoisted.deleteRagDocument.mockResolvedValue(undefined)
  hoisted.saveLectureNotesRagStatus.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ingestLectureRag', () => {
  it('stores notesRagged false when notes are at or below 10k characters', async () => {
    hoisted.getLectureRagContent.mockResolvedValueOnce({
      lectureId: 12,
      notes: 'x'.repeat(10_000),
      batchId: 4,
      sectionId: 5,
    })

    const { ingestLectureRag } = await import('../ingestLectureRag.service')
    const result = await ingestLectureRag(12)

    expect(hoisted.saveLectureNotesRagStatus).toHaveBeenCalledWith({
      lectureId: 12,
      notesRagged: false,
    })
    expect(hoisted.generateLectureNotesTocFromMarkdown).not.toHaveBeenCalled()
    expect(hoisted.ensureRagCollection).not.toHaveBeenCalled()
    expect(result).toEqual({
      lectureId: 12,
      notesRagged: false,
      notesCharacterCount: 10_000,
      notesToc: null,
      collectionName: null,
      jobs: [],
    })
  })

  it('generates a TOC, stores notesRagged true, and ingests long notes', async () => {
    const notes = 'x'.repeat(10_001)
    hoisted.getLectureRagContent.mockResolvedValueOnce({
      lectureId: 12,
      notes,
      batchId: 4,
      sectionId: 5,
    })
    hoisted.generateLectureNotesTocFromMarkdown.mockResolvedValueOnce('- Topic A')
    hoisted.ingestRagText.mockResolvedValueOnce({
      job_id: 'job-notes',
      status: 'PENDING',
    })

    const { ingestLectureRag } = await import('../ingestLectureRag.service')
    const result = await ingestLectureRag(12)

    expect(hoisted.generateLectureNotesTocFromMarkdown).toHaveBeenCalledWith(notes)
    expect(hoisted.saveLectureNotesRagStatus).toHaveBeenCalledWith({
      lectureId: 12,
      notesRagged: true,
      notesToc: '- Topic A',
    })
    expect(hoisted.ensureRagCollection).toHaveBeenCalledWith('student-lms-ai-tutor')
    expect(result).toEqual({
      lectureId: 12,
      notesRagged: true,
      notesCharacterCount: 10_001,
      notesToc: '- Topic A',
      collectionName: 'student-lms-ai-tutor',
      jobs: [
        {
          sourceType: 'notes',
          documentId: 'lecture-12-notes',
          documentName: 'lecture-12-notes',
          jobId: 'job-notes',
          status: 'PENDING',
        },
      ],
    })
  })

  it('propagates content lookup failures', async () => {
    hoisted.getLectureRagContent.mockRejectedValueOnce(
      Object.assign(new Error('AI_TUTOR_NOTES_NOT_FOUND'), {
        status: 404,
        code: 'AI_TUTOR_NOTES_NOT_FOUND',
      }),
    )

    const { ingestLectureRag } = await import('../ingestLectureRag.service')
    await expect(ingestLectureRag(1)).rejects.toMatchObject({
      code: 'AI_TUTOR_NOTES_NOT_FOUND',
    })
  })
})
