import { ApiError } from '@/server/api/http/apiError'

/** Shared request parsing for both the blocking and streaming create-session routes. */
export async function parseTopicId(request: Request): Promise<string> {
  const body = (await request.json().catch(() => null)) as {
    topicId?: unknown
  } | null
  const topicId = typeof body?.topicId === 'string' ? body.topicId.trim() : ''
  if (!topicId) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')
  return topicId
}
