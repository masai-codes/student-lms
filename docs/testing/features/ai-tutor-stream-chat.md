# AI Tutor streaming chat

Last updated: 2026-07-09

## Scope

- `POST /api/ai-tutor/chat/stream` — authenticated SSE lecture chat backed by `ai_chat_practice_questions`, lecture summary, instructor notes, and LLM-driven RAG retrieval via tool calling.

## Data sources

- `ai_chat_practice_questions` — per-user lecture chat thread + `chatHistory` JSON
- `lectures_ai.summary` — always included in the system prompt
- `lectures.notes` — inlined when `<= 10,000` chars; otherwise only an outline is shown
- External RAG platform — ingested notes/transcript; retrieved on demand via `retrieveLectureContent` tool

## Request body

```json
{
  "lectureId": 123,
  "chat": "What is useState?",
  "chatID": 45,
  "platform": "ios",
  "language": "hi"
}
```

## Environment

- `ANTHROPIC_API_KEY` — required
- `ANTHROPIC_MODEL` — optional; defaults to `claude-haiku-4-5`
- `RAG_PLATFORM_BASE_URL` — required for the retrieve tool
- `RAG_PLATFORM_API_KEY` — required for the retrieve tool
- `RAG_PLATFORM_COLLECTION_NAME` — optional; defaults to `student-lms-ai-tutor`

## Retrieval behavior

- The model decides whether to call `retrieveLectureContent`.
- Tool args: `query` (model-written search query) and `top_k` (1–20).
- Short notes (`<= 10k` chars) are already in the system prompt; long notes show an outline only.
- Lecture summary is always in the system prompt.
- If RAG is unconfigured, the tool is omitted and the tutor answers from summary/notes only.

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__
```
