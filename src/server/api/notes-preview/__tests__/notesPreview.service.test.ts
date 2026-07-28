import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  fetchLectureNotes: vi.fn(),
  fetchLectureSummary: vi.fn(),
  fetchResourceBody: vi.fn(),
  fetchAssignmentInstructions: vi.fn(),
}))

vi.mock('@/server/api/notes-preview/notesPreviewQueries', () => ({
  fetchLectureNotesForUser: hoisted.fetchLectureNotes,
  fetchLectureSummaryForUser: hoisted.fetchLectureSummary,
  fetchResourceBodyForUser: hoisted.fetchResourceBody,
  fetchAssignmentInstructionsForUser: hoisted.fetchAssignmentInstructions,
}))

async function importService() {
  return import('../notesPreview.service')
}

describe('getNotesPreviewContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns lecture notes for lecture/notes', async () => {
    hoisted.fetchLectureNotes.mockResolvedValueOnce('# Notes body')
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'notes',
      entityId: '157894',
    })

    expect(payload).toEqual({
      category: 'lecture',
      contentType: 'notes',
      entityId: 157894,
      content: '# Notes body',
    })
    expect(hoisted.fetchLectureNotes).toHaveBeenCalledWith(7, 157894)
    expect(hoisted.fetchLectureSummary).not.toHaveBeenCalled()
    expect(hoisted.fetchAssignmentInstructions).not.toHaveBeenCalled()
    expect(hoisted.fetchResourceBody).not.toHaveBeenCalled()
  })

  it('returns the AI summary for lecture/summary', async () => {
    hoisted.fetchLectureSummary.mockResolvedValueOnce('AI summary body')
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'summary',
      entityId: '42',
    })

    expect(payload.content).toBe('AI summary body')
    expect(hoisted.fetchLectureSummary).toHaveBeenCalledWith(7, 42)
    expect(hoisted.fetchLectureNotes).not.toHaveBeenCalled()
  })

  it('coerces a null lecture field to null content', async () => {
    hoisted.fetchLectureSummary.mockResolvedValueOnce(null)
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'summary',
      entityId: '42',
    })

    expect(payload.content).toBeNull()
  })

  it('returns resource body for resource/notes', async () => {
    hoisted.fetchResourceBody.mockResolvedValueOnce('# Pre-read body')
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'resource',
      contentType: 'notes',
      entityId: '515',
    })

    expect(payload).toEqual({
      category: 'resource',
      contentType: 'notes',
      entityId: 515,
      content: '# Pre-read body',
    })
    expect(hoisted.fetchResourceBody).toHaveBeenCalledWith(7, 515)
    expect(hoisted.fetchLectureNotes).not.toHaveBeenCalled()
  })

  it('treats resource/description as an alias for body', async () => {
    hoisted.fetchResourceBody.mockResolvedValueOnce('Resource description body')
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'resource',
      contentType: 'description',
      entityId: '515',
    })

    expect(payload.content).toBe('Resource description body')
  })

  it('coerces null resource body to null content', async () => {
    hoisted.fetchResourceBody.mockResolvedValueOnce(null)
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'resource',
      contentType: 'notes',
      entityId: '515',
    })

    expect(payload.content).toBeNull()
  })

  it('returns assignment instructions for assignment/instructions', async () => {
    hoisted.fetchAssignmentInstructions.mockResolvedValueOnce('Do the thing')
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 3,
      category: 'assignment',
      contentType: 'instructions',
      entityId: '900',
    })

    expect(payload.content).toBe('Do the thing')
    expect(hoisted.fetchAssignmentInstructions).toHaveBeenCalledWith(3, 900)
  })

  it('treats assignment/description as an alias for instructions', async () => {
    hoisted.fetchAssignmentInstructions.mockResolvedValueOnce(
      'Instructions text',
    )
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 3,
      category: 'assignment',
      contentType: 'description',
      entityId: '900',
    })

    expect(payload.content).toBe('Instructions text')
  })

  it('coerces null assignment instructions to null content', async () => {
    hoisted.fetchAssignmentInstructions.mockResolvedValueOnce(null)
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 3,
      category: 'assignment',
      contentType: 'instructions',
      entityId: '900',
    })

    expect(payload.content).toBeNull()
  })

  it('returns null content with null id for an invalid entityId', async () => {
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'notes',
      entityId: 'not-a-number',
    })

    expect(payload).toEqual({
      category: 'lecture',
      contentType: 'notes',
      entityId: null,
      content: null,
    })
    expect(hoisted.fetchLectureNotes).not.toHaveBeenCalled()
  })

  it('returns null content for a non-positive entityId', async () => {
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'notes',
      entityId: '0',
    })

    expect(payload.entityId).toBeNull()
    expect(payload.content).toBeNull()
  })

  it('returns null content for an unsupported category', async () => {
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'course',
      contentType: 'notes',
      entityId: '10',
    })

    expect(payload.content).toBeNull()
    expect(hoisted.fetchLectureNotes).not.toHaveBeenCalled()
    expect(hoisted.fetchAssignmentInstructions).not.toHaveBeenCalled()
    expect(hoisted.fetchResourceBody).not.toHaveBeenCalled()
  })

  it('returns null content for an unsupported contentType', async () => {
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'transcript',
      entityId: '10',
    })

    expect(payload.content).toBeNull()
    expect(hoisted.fetchLectureNotes).not.toHaveBeenCalled()
  })

  it('returns null content for resource with an unsupported contentType', async () => {
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'resource',
      contentType: 'summary',
      entityId: '515',
    })

    expect(payload.content).toBeNull()
    expect(hoisted.fetchResourceBody).not.toHaveBeenCalled()
  })
})
