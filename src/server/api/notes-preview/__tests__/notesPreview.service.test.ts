import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getLecture: vi.fn(),
  getAssignment: vi.fn(),
}))

vi.mock('@/server/learn/services/getLectureLearningDetail.service', () => ({
  getLectureLearningDetailForUser: hoisted.getLecture,
}))

vi.mock('@/server/learn/services/getAssignmentLearningDetail.service', () => ({
  getAssignmentLearningDetailForUser: hoisted.getAssignment,
}))

async function importService() {
  return import('../notesPreview.service')
}

describe('getNotesPreviewContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns lecture notes for lecture/notes', async () => {
    hoisted.getLecture.mockResolvedValueOnce({
      notes: '# Notes body',
      tabs: { aiSummary: 'summary body' },
    })
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
    expect(hoisted.getLecture).toHaveBeenCalledWith(7, 157894)
    expect(hoisted.getAssignment).not.toHaveBeenCalled()
  })

  it('returns the AI summary for lecture/summary', async () => {
    hoisted.getLecture.mockResolvedValueOnce({
      notes: 'notes body',
      tabs: { aiSummary: 'AI summary body' },
    })
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'summary',
      entityId: '42',
    })

    expect(payload.content).toBe('AI summary body')
  })

  it('coerces a null lecture field to null content', async () => {
    hoisted.getLecture.mockResolvedValueOnce({
      notes: null,
      tabs: { aiSummary: null },
    })
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 7,
      category: 'lecture',
      contentType: 'summary',
      entityId: '42',
    })

    expect(payload.content).toBeNull()
  })

  it('returns assignment instructions for assignment/instructions', async () => {
    hoisted.getAssignment.mockResolvedValueOnce({
      instructions: 'Do the thing',
    })
    const { getNotesPreviewContent } = await importService()

    const payload = await getNotesPreviewContent({
      userId: 3,
      category: 'assignment',
      contentType: 'instructions',
      entityId: '900',
    })

    expect(payload.content).toBe('Do the thing')
    expect(hoisted.getAssignment).toHaveBeenCalledWith(3, 900)
  })

  it('treats assignment/description as an alias for instructions', async () => {
    hoisted.getAssignment.mockResolvedValueOnce({
      instructions: 'Instructions text',
    })
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
    hoisted.getAssignment.mockResolvedValueOnce({ instructions: null })
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
    expect(hoisted.getLecture).not.toHaveBeenCalled()
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
    expect(hoisted.getLecture).not.toHaveBeenCalled()
    expect(hoisted.getAssignment).not.toHaveBeenCalled()
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
    expect(hoisted.getLecture).not.toHaveBeenCalled()
  })
})
