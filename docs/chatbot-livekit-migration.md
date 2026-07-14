# LiveKit Chatbot Migration Notes

This module migrates the `livekit-chat-agent` frontend and backend into `student-lms` while keeping:

- the Python `agent` untouched
- chatbot code isolated under dedicated `chatbot` frontend/backend namespaces
- split persistence: LMS DB for sessions, MongoDB for messages only

## New frontend route

- Protected chatbot UI route: `/chatbot/:lectureId`
- Route file: `src/routes/(protected)/_layout/chatbot/$lectureId.tsx`

## API routes

- `POST /api/chatbot/:lectureId/token`
- `GET /api/chatbot/:lectureId/sessions`
- `POST /api/chatbot/:lectureId/sessions`
- `PATCH /api/chatbot/:lectureId/sessions/:sessionId`
- `GET /api/chatbot/:lectureId/sessions/:sessionId/messages`
- `POST /api/chatbot/:lectureId/sessions/:sessionId/messages`
- `GET /api/chatbot/internal/sessions/:sessionId/messages` (requires `X-Internal-Api-Key`)

## Storage model

- `chatbot_sessions` table in LMS DB stores:
  - `id`
  - `user_id`
  - `lecture_id`
  - `title`
  - `last_mode`
  - `created_at`
  - `updated_at`
- MongoDB `messages` collection stores transcript/chat messages keyed by `sessionId`.

## Required environment variables

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_URL`
- `INTERNAL_API_KEY` (used by internal session history endpoint for the agent)
- `CHATBOT_MONGODB_URI` (fallback to `MONGODB_URI` if not set)
- `CHATBOT_MONGODB_DB_NAME` (optional, defaults to `livekit_chat`)

## Verification checklist

1. Open `/chatbot/<lectureId>` as an authenticated user.
2. Create a session and confirm it appears in `chatbot_sessions` with real `user_id` + `lecture_id`.
3. Connect in text mode, send a message, and verify reply appears.
4. Connect in voice mode and verify:
   - mic publishes audio
   - agent audio is audible after start-audio prompt
5. Confirm persisted transcript entries exist only in MongoDB `messages`.
6. Confirm `/api/chatbot/internal/sessions/:sessionId/messages` returns history with valid internal key.
