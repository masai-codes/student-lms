# AI Tutor RAG lecture ingestion

Last updated: 2026-07-09

## Scope

- `GET /api/ai-tutor/lectures/:lectureId/ingest` — internal endpoint that prepares instructor notes for AI tutor retrieval.

## Behavior

1. Read `lectures.notes`.
2. If notes are missing → `404 AI_TUTOR_NOTES_NOT_FOUND`.
3. If notes are at or below 10,000 characters:
   - Store `lectures.data.notesRagged = false`
   - Return `notesRagged: false` with no TOC or RAG job
4. If notes exceed 10,000 characters:
   - Generate a Markdown table of contents via Claude
   - Store `lectures.data.notesRagged = true` and `lectures.data.aiTutorNotesToc`
   - Ingest notes into the external RAG platform

## Auth

- Header: `x-ai-tutor-rag-ingest-secret`
- Env: `AI_TUTOR_RAG_INGEST_SECRET`
- No user session required

## Environment

- `RAG_PLATFORM_BASE_URL`, `RAG_PLATFORM_API_KEY` — required when notes are ragged
- `RAG_PLATFORM_COLLECTION_NAME` — optional; defaults to `student-lms-ai-tutor`
- `ANTHROPIC_API_KEY` — required when notes are ragged
- `ANTHROPIC_MODEL` — optional; defaults to `claude-haiku-4-5`

## Response (not ragged)

```json
{
  "lectureId": 338,
  "notesRagged": false,
  "notesCharacterCount": 5000,
  "notesToc": null,
  "collectionName": null,
  "jobs": []
}
```

## Response (ragged)

```json
{
  "lectureId": 338,
  "notesRagged": true,
  "notesCharacterCount": 18500,
  "notesToc": "- Arrays\n  - Bubble sort",
  "collectionName": "student-lms-ai-tutor",
  "jobs": [
    {
      "sourceType": "notes",
      "documentId": "lecture-338-notes",
      "documentName": "lecture-338-notes",
      "jobId": "550e8400-...",
      "status": "PENDING"
    }
  ]
}
```

## Test cases

| ID | Case | Expected |
|----|------|----------|
| AT-RAG-001 | Missing ingest secret env | `503 AI_TUTOR_RAG_INGEST_NOT_CONFIGURED` |
| AT-RAG-002 | Missing/wrong secret header | `401 AI_TUTOR_RAG_INGEST_FORBIDDEN` |
| AT-RAG-003 | Invalid lectureId | `400 AI_TUTOR_LECTURE_ID_INVALID` |
| AT-RAG-004 | Lecture not found | `404 AI_TUTOR_LECTURE_NOT_FOUND` |
| AT-RAG-005 | Notes missing/blank | `404 AI_TUTOR_NOTES_NOT_FOUND` |
| AT-RAG-006 | Notes at or below 10k chars | `notesRagged: false` persisted; no TOC/RAG |
| AT-RAG-007 | Notes above 10k chars | TOC generated, `notesRagged: true` persisted, RAG job returned |
| AT-RAG-008 | Empty LLM TOC response | `503 AI_TUTOR_NOTES_TOC_GENERATION_FAILED` |
| AT-RAG-009 | Unexpected service failure | `500 SERVER_ERROR_INGESTING_LECTURE_RAG` |

## Commands

```bash
npm run test -- src/server/api/ai-tutor/__tests__/ingestLectureRag.service.test.ts
npm run test -- src/server/api/ai-tutor/__tests__/generateLectureNotesTocFromMarkdown.test.ts
npm run test -- src/server/api/ai-tutor/__tests__/lectureNotesTocData.test.ts
npm run test -- src/server/api/ai-tutor/__tests__/ingestLectureRag.handler.test.ts
```
