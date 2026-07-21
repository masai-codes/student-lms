import { ApiError } from '@/server/api/http/apiError'

export function parsePositiveIdParam(
  value: string,
  code = 'INVALID_ID',
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(400, code)
  }
  return parsed
}
