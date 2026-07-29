import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({ fetchJson: vi.fn() }))

vi.mock('@/lib/api/fetchJson', () => ({
  fetchJson: hoisted.fetchJson,
}))

describe('notesPreviewApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds the query path with encoded params', async () => {
    const { buildNotesPreviewPath } = await import('../notesPreviewApi')

    expect(
      buildNotesPreviewPath({
        category: 'lecture',
        contentType: 'notes',
        entityId: '157894',
      }),
    ).toBe(
      '/api/notes-preview?category=lecture&contentType=notes&entityId=157894',
    )
  })

  it('fetches and returns the payload', async () => {
    const payload = {
      category: 'lecture',
      contentType: 'notes',
      entityId: 157894,
      content: '# Notes',
    }
    hoisted.fetchJson.mockResolvedValueOnce(payload)
    const { fetchNotesPreviewFromApi } = await import('../notesPreviewApi')

    await expect(
      fetchNotesPreviewFromApi({
        category: 'lecture',
        contentType: 'notes',
        entityId: '157894',
      }),
    ).resolves.toEqual(payload)
    expect(hoisted.fetchJson).toHaveBeenCalledWith(
      '/api/notes-preview?category=lecture&contentType=notes&entityId=157894',
    )
  })

  it('maps an API client error to a code-only Error', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(
      new ApiClientError(401, { code: 'UNAUTHORIZED' }),
    )
    const { fetchNotesPreviewFromApi } = await import('../notesPreviewApi')

    await expect(
      fetchNotesPreviewFromApi({
        category: 'lecture',
        contentType: 'notes',
        entityId: '1',
      }),
    ).rejects.toThrow('UNAUTHORIZED')
  })

  it('rethrows unexpected (non-API) errors', async () => {
    hoisted.fetchJson.mockRejectedValueOnce(new Error('offline'))
    const { fetchNotesPreviewFromApi } = await import('../notesPreviewApi')

    await expect(
      fetchNotesPreviewFromApi({
        category: 'lecture',
        contentType: 'notes',
        entityId: '1',
      }),
    ).rejects.toThrow('offline')
  })
})
