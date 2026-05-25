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
      case 'SERVER_ERROR_FETCHING_DASHBOARD_ANNOUNCEMENTS':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_PRODUCT_UPDATES':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_DASHBOARD_SCHEDULE':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_DASHBOARD_BANNERS':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_DASHBOARD_ACTION_BANNERS':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_DASHBOARD_PENDING_TASKS':
        return jsonError(500, error.message)
      case 'EXPERIENCE_API_NOT_CONFIGURED':
      case 'EXPERIENCE_API_REQUEST_FAILED':
      case 'EXPERIENCE_API_EMPTY_RESPONSE':
        return jsonError(503, error.message)
      case 'ASSESS_PLATFORM_NOT_CONFIGURED':
      case 'ASSESS_PLATFORM_LINK_MISSING':
      case 'ASSESS_PLATFORM_CLIENT_ID_MISSING':
      case 'ASSESS_PLATFORM_TOKEN_MISSING':
      case 'ASSESS_PLATFORM_REPORT_FAILED':
      case 'ASSESS_PLATFORM_REPORT_TOKEN_MISSING':
      case 'ASSESS_PLATFORM_VIEW_URL_FAILED':
      case 'ASSESS_PLATFORM_VIEW_URL_MISSING':
        return jsonError(503, error.message)
      case 'SUBMISSION_NOT_FOUND':
      case 'INVALID_SUBMISSION_ID':
      case 'INVALID_SUBMISSION_PAYLOAD':
        return jsonError(400, error.message)
      default:
        break
    }
  }

  console.error('Unhandled API error', error)
  return jsonError(500, 'INTERNAL_SERVER_ERROR')
}
