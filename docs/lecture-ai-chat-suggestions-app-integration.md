# Lecture AI Chat Suggestions — App Integration Guide

Use this when updating the mobile app (Expo / React Native) so Lecture AI Chat
empty-state suggestion chips come from the **new LMS lecture detail API**,
instead of the old FAQs endpoint + hardcoded prompts.

## What changed

| Before (old)                                               | After (new LMS)                      |
| ---------------------------------------------------------- | ------------------------------------ |
| Extra call: `GET /api/ai-tutor/lectures/:lectureId/faqs`   | No separate FAQs call                |
| App hardcoded 3 generic prompts (summary / explain / quiz) | Server returns them with a `kind`    |
| FAQ items were `{ question, answer }`                      | Suggestions are `{ kind, question }` |

**Breaking:** `GET /api/ai-tutor/lectures/:lectureId/faqs` is **removed**. Do not
call it. Read `aiChatSuggestions` from the lecture detail payload you already
fetch for the lecture screen.

## Endpoint

```
GET /api/learn/lectures/:lectureId
```

Example:

```
GET https://learn.masaischool.com/api/learn/lectures/156991
```

Auth: same session cookie as other protected LMS APIs. Unauthenticated → `401`.

The lecture detail response now includes:

```json
{
  "aiChatSuggestions": [
    {
      "kind": "faq",
      "question": "How do I access query parameters in Express?"
    },
    {
      "kind": "faq",
      "question": "What is the difference between req.query and req.params?"
    },
    {
      "kind": "faq",
      "question": "How do I set or update query params?"
    },
    {
      "kind": "summary",
      "question": "Summarize the key points of this lecture"
    },
    {
      "kind": "explain",
      "question": "What are the core concepts I should understand?"
    },
    {
      "kind": "quiz",
      "question": "Quiz me on this lecture"
    }
  ]
}
```

## Types

```ts
export type LectureAiChatSuggestionKind =
  | 'faq'
  | 'summary'
  | 'explain'
  | 'quiz'

export type LectureAiChatSuggestion = {
  kind: LectureAiChatSuggestionKind
  question: string
}

// On LectureDetailPayload (and whatever typed lecture detail model the app uses):
aiChatSuggestions: LectureAiChatSuggestion[]
```

Rules the backend already enforces:

- Always an **array** (never `null` / omitted). May be defaults-only when the
  lecture has no FAQs.
- Up to **3** randomized lecture FAQs (`kind: 'faq'`) first.
- Then the **3** generic prompts (`summary`, `explain`, `quiz`).
- Combined list hard-capped at **6**.

Do **not** re-hardcode the generic prompts in the app. Render the server list
as-is so web and app stay in sync.

## App migration checklist

1. **Stop calling** `GET /api/ai-tutor/lectures/:lectureId/faqs`.
2. **Extend** your lecture-detail type with `aiChatSuggestions`.
3. **Plumb** `detail.aiChatSuggestions` into the Lecture AI Chat empty state
   (drawer / sheet). Prefer reading it from the lecture screen you already
   loaded — no second network request.
4. **Render one list** of chips from `aiChatSuggestions`:
   - Label = `suggestion.question`
   - On press → send `suggestion.question` as the user chat message (same as
     tapping a suggestion today).
5. **Map icons by `kind`** (web reference):

   | `kind`    | Suggested meaning          | Web icon (Lucide) |
   | --------- | -------------------------- | ----------------- |
   | `faq`     | Smart / lecture-specific Q | `Lightbulb`       |
   | `summary` | Summarize lecture          | `NotebookText`    |
   | `explain` | Core concepts              | `BookOpen`        |
   | `quiz`    | Practice quiz              | `ClipboardList`   |

   Use Phosphor / your existing icon set equivalents if you prefer; keep
   per-`kind` distinction.

6. **Remove** local hardcoded suggestion copy (summary / explain / quiz strings).
7. **Empty list:** if `aiChatSuggestions.length === 0`, show the empty-state
   heading/blurb without chips (rare — server normally always appends the three
   defaults).
8. **Analytics (optional parity with web):** FAQ taps fire
   `l_learn_lecture_ai_chat_faq_click_id_<lectureId>` with `{ question }`.
   Generic kinds currently have no dedicated GTM event on web.

## UI behaviour (match web)

- Show chips only when the chat thread is **empty** (no messages yet).
- Order: server order — FAQs first, then generics. Do not re-sort client-side.
- FAQ shuffle is fixed for the **page visit** (baked into the lecture detail
  payload). Do not expect a new shuffle on every drawer open unless you refetch
  lecture detail.

## What not to do

- Do not call the deleted FAQs endpoint “just in case”.
- Do not merge server FAQs with a second local list of generics — that can
  duplicate prompts when the API already includes them.
- Do not use `answer` from the old FAQ payload — it is gone; only `question`
  is sent as the user message.
- Do not assume more than 6 items; treat `> 6` as a bug if you somehow see it.

## Web reference (behaviour to mirror)

- Builder: `src/server/learn/utils/buildLectureAiChatSuggestions.ts`
- Payload field: `LectureDetailPayload.aiChatSuggestions` in
  `src/server/learn/lectureDetailTypes.ts`
- Empty state UI: `src/components/features/lecture-ai-chat/components/LectureAiChatEmptyState.tsx`
- Provided from lecture page via
  `LectureAiChatSuggestionsProvider` in
  `src/components/features/learn/LearnPageDetails/lecture/LectureDetailPage.tsx`

## Quick verify

1. Open a lecture that has AI FAQs seeded → detail JSON includes
   `aiChatSuggestions` with `kind: "faq"` items + the three generics (≤ 6).
2. Open a lecture with no FAQs → still get the three generic suggestions.
3. Confirm the app no longer hits `/api/ai-tutor/lectures/.../faqs` (network
   tab / proxy).
4. Tap each chip → composer / stream sends that exact `question` string.
