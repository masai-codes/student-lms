import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getSupportEntityContext } from '@/server/api/support/services/getSupportEntityContext.service'
import { mapSupportError, requireIntParam } from '@/server/api/support/http'

export async function handleGetSupportEntityContext(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const url = new URL(request.url)
    const category = url.searchParams.get('category')?.trim()
    if (!category) throw new Error('SUPPORT_INVALID_ENTITY_CATEGORY')
    const entityId = requireIntParam(url, 'entityId', 'SUPPORT_INVALID_ENTITY_ID')
    const context = await getSupportEntityContext(userId, category, entityId)
    return jsonOk(context)
  } catch (error) {
    return mapSupportError(error)
  }
}
