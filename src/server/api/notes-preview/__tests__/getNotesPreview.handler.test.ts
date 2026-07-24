import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  requireSessionUserId: vi.fn(),
  getNotesPreviewContent: vi.fn(),
}))

vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: hoisted.requireSessionUserId,
}))

vi.mock('@/server/api/notes-preview/notesPreview.service', () => ({
  getNotesPreviewContent: hoisted.getNotesPreviewContent,
}))

async function importHandler() {
  return import('../handlers/getNotesPreview.handler')
}

describe('handleGetNotesPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves the user and returns the payload with 200', async () => {
    hoisted.requireSessionUserId.mockResolvedValueOnce(7)
    const payload = {
      category: 'lecture',
      contentType: 'notes',
      entityId: 157894,
      content: '# Notes',
    }
    hoisted.getNotesPreviewContent.mockResolvedValueOnce(payload)
    const { handleGetNotesPreview } = await importHandler()

    const response = await handleGetNotesPreview(
      new Request(
        'https://learn.example.com/api/notes-preview?category=lecture&contentType=notes&entityId=157894',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(hoisted.getNotesPreviewContent).toHaveBeenCalledWith({
      userId: 7,
      category: 'lecture',
      contentType: 'notes',
      entityId: '157894',
    })
  })

  it('defaults missing query params to empty strings', async () => {
    hoisted.requireSessionUserId.mockResolvedValueOnce(7)
    hoisted.getNotesPreviewContent.mockResolvedValueOnce({
      category: '',
      contentType: '',
      entityId: null,
      content: null,
    })
    const { handleGetNotesPreview } = await importHandler()

    await handleGetNotesPreview(
      new Request('https://learn.example.com/api/notes-preview'),
    )

    expect(hoisted.getNotesPreviewContent).toHaveBeenCalledWith({
      userId: 7,
      category: '',
      contentType: '',
      entityId: '',
    })
  })

  it('maps an unauthenticated request to a 401 response', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.requireSessionUserId.mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )
    const { handleGetNotesPreview } = await importHandler()

    const response = await handleGetNotesPreview(
      new Request('https://learn.example.com/api/notes-preview'),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: 'UNAUTHORIZED',
    })
    expect(hoisted.getNotesPreviewContent).not.toHaveBeenCalled()
  })
})
