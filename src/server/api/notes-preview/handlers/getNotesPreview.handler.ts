import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getNotesPreviewContent } from '@/server/api/notes-preview/notesPreview.service'

export async function handleGetNotesPreview(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const url = new URL(request.url)
    const payload = await getNotesPreviewContent({
      userId,
      category: url.searchParams.get('category') ?? '',
      contentType: url.searchParams.get('contentType') ?? '',
      entityId: url.searchParams.get('entityId') ?? '',
    })
    return jsonOk(payload)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
