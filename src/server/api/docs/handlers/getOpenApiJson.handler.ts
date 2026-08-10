import { buildOpenApiDocument } from '@/server/api/docs/buildOpenApiDocument'
import { isApiDocsEnabled } from '@/server/api/docs/isApiDocsEnabled'
import { logger } from '@/lib/logger'

const FN = 'getOpenApiJson'

export async function handleGetOpenApiJson(): Promise<Response> {
  if (!isApiDocsEnabled()) {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const doc = await buildOpenApiDocument()
    return Response.json(doc, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    logger.error({
      msg: 'Failed to build OpenAPI document',
      fn: FN,
      err: error,
    })
    return Response.json({ error: 'FAILED_TO_BUILD_OPENAPI' }, { status: 500 })
  }
}
