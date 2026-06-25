import { isApiError } from '@/server/api/http/apiError'
import { cloudFrontSafeResponseInit } from '@/lib/api/cloudFrontSafeStatus'

export type ApiErrorBody = {
  code: string
  message: string
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, { status: 200, ...init })
}

export function jsonError(
  status: number,
  code: string,
  message?: string,
): Response {
  const body: ApiErrorBody = {
    code,
    message: message ?? code,
  }
  // Remap CloudFront-intercepted statuses (403/404) so the JSON body survives.
  return Response.json(body, cloudFrontSafeResponseInit(status))
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
      case 'SERVER_ERROR_FETCHING_BOOKMARKS':
        return jsonError(500, error.message)
      case 'ANNOUNCEMENT_NOT_FOUND':
        return jsonError(404, error.message)
      case 'SERVER_ERROR_FETCHING_ANNOUNCEMENT':
      case 'SERVER_ERROR_FETCHING_ANNOUNCEMENTS':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_ENROLLED_BATCHES':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA':
        return jsonError(500, error.message)
      case 'SERVER_ERROR_FETCHING_LEARN_PAGE_DATA':
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
      case 'SERVER_ERROR_FETCHING_MASAIVERSE_V2_HOME':
      case 'SERVER_ERROR_MARKING_MASAIVERSE_VISITED':
      case 'SERVER_ERROR_CREATING_DISCUSSION':
      case 'SERVER_ERROR_VOTING_DISCUSSION':
      case 'SERVER_ERROR_FETCHING_REPLIES':
      case 'SERVER_ERROR_CREATING_REPLY':
      case 'SERVER_ERROR_FETCHING_DISCUSSIONS':
      case 'SERVER_ERROR_FETCHING_MY_CLUBS':
      case 'SERVER_ERROR_FETCHING_CLUB_DETAIL':
      case 'SERVER_ERROR_FETCHING_CLUB_STATS':
      case 'SERVER_ERROR_FETCHING_CLUB_LEADERBOARD':
      case 'SERVER_ERROR_FETCHING_GLOBAL_LEADERBOARD':
      case 'SERVER_ERROR_FETCHING_CLUB_EVENTS':
      case 'SERVER_ERROR_RECORDING_CLUB_VISIT':
      case 'SERVER_ERROR_UPDATING_CLUB_MEMBERSHIP':
      case 'SERVER_ERROR_FETCHING_EVENTS_LIST':
      case 'SERVER_ERROR_FETCHING_EVENT_DETAIL':
      case 'SERVER_ERROR_ENROLLING_EVENT':
      case 'SERVER_ERROR_RATING_EVENT':
      case 'SERVER_ERROR_FETCHING_ADMIN_MODE':
      case 'SERVER_ERROR_UPDATING_ADMIN_MODE':
      case 'SERVER_ERROR_CREATING_EVENT':
      case 'SERVER_ERROR_CREATING_CLUB':
      case 'SERVER_ERROR_UPDATING_EVENT':
      case 'SERVER_ERROR_UPDATING_CLUB':
      case 'SERVER_ERROR_FETCHING_CLUB_EDIT_DATA':
      case 'SERVER_ERROR_FETCHING_EVENT_EDIT_DATA':
      case 'SERVER_ERROR_UPLOADING_IMAGE':
      case 'SERVER_ERROR_FETCHING_BANNERS':
      case 'SERVER_ERROR_CREATING_BANNER':
      case 'SERVER_ERROR_UPDATING_BANNER':
      case 'SERVER_ERROR_DELETING_BANNER':
      case 'SERVER_ERROR_AWARDING_POINTS':
      case 'SERVER_ERROR_SEARCHING_USERS':
        return jsonError(500, error.message)
      case 'INVALID_ADMIN_MODE_PAYLOAD':
      case 'INVALID_UPDATE_PAYLOAD':
        return jsonError(400, error.message)
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
      case 'AI_TUTOR_DAILY_LIMIT':
        return jsonError(429, error.message)
      case 'AI_TUTOR_LECTURE_FORBIDDEN':
        return jsonError(403, error.message)
      case 'AI_TUTOR_LECTURE_NOT_FOUND':
      case 'AI_TUTOR_SESSION_NOT_FOUND':
        return jsonError(404, error.message)
      case 'AI_TUTOR_SESSION_NOT_OWNED':
        return jsonError(403, error.message)
      case 'AI_TUTOR_TRANSCRIPT_UNAVAILABLE':
        return jsonError(409, error.message)
      case 'AI_TUTOR_TOKEN_SERVER_NOT_CONFIGURED':
      case 'AI_TUTOR_TOKEN_SERVER_TIMEOUT':
      case 'AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED':
      case 'AI_TUTOR_TOKEN_SERVER_INVALID_RESPONSE':
      case 'AI_TUTOR_TOKEN_SERVER_DISPATCH_FAILED':
      case 'AI_TUTOR_TOKEN_SERVER_END_FAILED':
      case 'AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED':
      case 'AI_TUTOR_SESSION_CREATE_FAILED':
      case 'AI_TUTOR_RECORD_INSERT_FAILED':
        return jsonError(503, error.message)
      case 'AI_CHAT_MESSAGE_EMPTY':
      case 'AI_CHAT_MESSAGE_TOO_LONG':
        return jsonError(400, error.message)
      case 'AI_TUTOR_CHAT_PROMPT_EMPTY':
      case 'AI_TUTOR_CHAT_PROMPT_TOO_LONG':
      case 'AI_TUTOR_CHAT_MESSAGE_EMPTY':
      case 'AI_TUTOR_CHAT_MESSAGE_TOO_LONG':
      case 'AI_TUTOR_LECTURE_ID_INVALID':
      case 'AI_TUTOR_CHAT_ID_INVALID':
        return jsonError(400, error.message)
      case 'AI_TUTOR_CHAT_NOT_FOUND':
      case 'AI_TUTOR_LECTURE_SUMMARY_NOT_FOUND':
        return jsonError(404, error.message)
      case 'SERVER_ERROR_STREAMING_AI_TUTOR_CHAT':
      case 'SERVER_ERROR_CREATING_AI_TUTOR_CHAT':
      case 'SERVER_ERROR_FETCHING_AI_TUTOR_CONVERSATIONS':
      case 'SERVER_ERROR_FETCHING_AI_TUTOR_CONVERSATION':
        return jsonError(500, error.message)
      case 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED':
        return jsonError(503, error.message)
      case 'AI_CHAT_OPENAI_NOT_CONFIGURED':
      case 'AI_CHAT_OPENAI_REQUEST_FAILED':
      case 'AI_CHAT_OPENAI_EMPTY_RESPONSE':
      case 'AI_CHAT_OPENAI_TIMEOUT':
      case 'AI_CHAT_MESSAGE_INSERT_FAILED':
        return jsonError(503, error.message)
      case 'CHATBOT_INVALID_LECTURE_ID':
      case 'CHATBOT_INVALID_SESSION_PAYLOAD':
      case 'CHATBOT_INVALID_SESSION_PATCH':
      case 'CHATBOT_INVALID_MESSAGE_PAYLOAD':
      case 'CHATBOT_INVALID_TOKEN_PAYLOAD':
      case 'CHATBOT_MESSAGE_EMPTY':
        return jsonError(400, error.message)
      case 'CHATBOT_UNAUTHORIZED_INTERNAL':
        return jsonError(401, error.message)
      case 'CHATBOT_SESSION_NOT_FOUND':
        return jsonError(404, error.message)
      case 'CHATBOT_MONGODB_URI_NOT_CONFIGURED':
      case 'CHATBOT_LIVEKIT_API_KEY_NOT_CONFIGURED':
      case 'CHATBOT_LIVEKIT_API_SECRET_NOT_CONFIGURED':
      case 'CHATBOT_LIVEKIT_URL_NOT_CONFIGURED':
      case 'CHATBOT_SESSION_CREATE_FAILED':
        return jsonError(503, error.message)
      case 'INVALID_DISCUSSION_PAYLOAD':
      case 'INVALID_DISCUSSION_TITLE':
      case 'INVALID_DISCUSSION_MESSAGE':
      case 'INVALID_REPLY_MESSAGE':
      case 'INVALID_ENTITY_ID':
      case 'INVALID_DISCUSSION_ID':
        return jsonError(400, error.message)
      case 'DISCUSSION_FORBIDDEN':
        return jsonError(403, error.message)
      case 'DISCUSSION_NOT_FOUND':
        return jsonError(404, error.message)
      case 'DISCUSSION_CLOSED':
        return jsonError(409, error.message)
      case 'DISCUSSION_CREATE_FAILED':
        return jsonError(500, error.message)
      case 'INVALID_FEEDBACK_PAYLOAD':
        return jsonError(400, error.message)
      case 'FEEDBACK_WINDOW_CLOSED':
        return jsonError(409, error.message)
      case 'ZOOM_REDIRECT_FORBIDDEN':
        return jsonError(403, error.message)
      case 'ZOOM_REDIRECT_FAILED':
        return jsonError(503, error.message)
      default:
        break
    }
  }

  console.error('Unhandled API error', error)
  return jsonError(500, 'INTERNAL_SERVER_ERROR')
}
