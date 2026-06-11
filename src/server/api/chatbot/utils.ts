import { ApiError } from '@/server/api/http/apiError'

export function parseLectureId(value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'CHATBOT_INVALID_LECTURE_ID')
  }
  return parsed
}

export function requireInternalApiKey(request: Request): void {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || request.headers.get('X-Internal-Api-Key') !== expected) {
    throw new ApiError(401, 'CHATBOT_UNAUTHORIZED_INTERNAL')
  }
}

