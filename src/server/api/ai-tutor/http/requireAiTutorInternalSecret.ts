import { ApiError } from '@/server/api/http/apiError'

export const AI_TUTOR_INTERNAL_SECRET_HEADER = 'x-ai-tutor-rag-ingest-secret'

export function requireAiTutorInternalSecret(request: Request): void {
  const expected = process.env.AI_TUTOR_RAG_INGEST_SECRET?.trim()
  if (!expected) {
    throw new ApiError(503, 'AI_TUTOR_RAG_INGEST_NOT_CONFIGURED')
  }

  const provided = request.headers.get(AI_TUTOR_INTERNAL_SECRET_HEADER)?.trim()
  if (!provided || provided !== expected) {
    throw new ApiError(401, 'AI_TUTOR_RAG_INGEST_FORBIDDEN')
  }
}
