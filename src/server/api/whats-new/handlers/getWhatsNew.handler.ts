import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { getWhatsNew } from '@/server/api/whats-new/getWhatsNew.service'

function parsePage(url: URL): number {
  const raw = parseInt(url.searchParams.get('page') ?? '1', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : 1
}

export async function handleGetWhatsNew(request: Request): Promise<Response> {
  try {
    const page = parsePage(new URL(request.url))
    const { items, total } = await getWhatsNew(page)
    return jsonOk({ items, total })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch whats-new list', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_WHATS_NEW'))
    }
    return mapThrownErrorToResponse(error)
  }
}
