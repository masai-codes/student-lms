import { isApiError } from '@/server/api/http/apiError'

export type ApiErrorBody = {
  code: string
  message: string
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, { status: 200, ...init })
}

export function jsonError(status: number, code: string, message?: string): Response {
  const body: ApiErrorBody = {
    code,
    message: message ?? code,
  }
  return Response.json(body, { status })
}

export function mapThrownErrorToResponse(error: unknown): Response {
  if (isApiError(error)) {
    return jsonError(error.status, error.code, error.message)
  }

  if (error instanceof Error) {
    switch (error.message) {
      case 'UNAUTHORIZED':
        return jsonError(401, 'UNAUTHORIZED')
      case 'LEARN_DETAIL_NOT_FOUND':
      case 'ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE':
      case 'RESOURCE_DETAIL_UNSUPPORTED_TYPE':
      case 'LECTURE_DETAIL_UNSUPPORTED_TYPE':
        return jsonError(404, error.message)
      case 'SERVER_ERROR_FETCHING_ENROLLED_BATCHES':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA':
        return jsonError(500, error.message)
      default:
        break
    }
  }

  console.error('Unhandled API error', error)
  return jsonError(500, 'INTERNAL_SERVER_ERROR')
}
