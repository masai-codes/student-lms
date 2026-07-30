import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getNotesPreviewContent } from '@/server/api/notes-preview/notesPreview.service'

export async function handleGetNotesPreview(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url)
  const category = url.searchParams.get('category') ?? ''
  const contentType = url.searchParams.get('contentType') ?? ''
  const entityId = url.searchParams.get('entityId') ?? ''

  try {
    const userId = await requireSessionUserId()
    console.info('[notes-preview] request', {
      userId,
      category,
      contentType,
      entityId,
    })
    const payload = await getNotesPreviewContent({
      userId,
      category,
      contentType,
      entityId,
    })
    console.info('[notes-preview] success', {
      userId,
      category,
      contentType,
      entityId: payload.entityId,
      contentLength: payload.content?.length ?? null,
    })
    return jsonOk(payload)
  } catch (error) {
    console.error('[notes-preview] failed', {
      category,
      contentType,
      entityId,
      error: error instanceof Error ? error.message : String(error),
    })
    return mapThrownErrorToResponse(error)
  }
}
