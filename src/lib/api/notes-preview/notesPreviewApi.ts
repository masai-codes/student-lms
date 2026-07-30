import type { NotesPreviewPayload } from '@/server/api/notes-preview/notesPreview.service'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'

export interface NotesPreviewQuery {
  category: string
  contentType: string
  entityId: string
}

export function buildNotesPreviewPath({
  category,
  contentType,
  entityId,
}: NotesPreviewQuery): string {
  const params = new URLSearchParams({ category, contentType, entityId })
  return `/api/notes-preview?${params.toString()}`
}

export async function fetchNotesPreviewFromApi(
  query: NotesPreviewQuery,
): Promise<NotesPreviewPayload> {
  try {
    return await fetchJson<NotesPreviewPayload>(buildNotesPreviewPath(query))
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}
