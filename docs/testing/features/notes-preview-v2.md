# Notes Preview v2 (`/notes-preview-v2`)

## Scope

- **Standalone WebView route** (`src/routes/notes-preview-v2.tsx`): a chrome-less
  page rendered outside the `(protected)/_layout` app shell (no navbar, mobile
  tab bar, or Clarity tracking). It reads `token`/`category`/`contentType`/
  `entityId` from the query string via `validateSearch`, and a `beforeLoad`
  exchanges the one-time bootstrap `?token=` JWT for a session cookie
  (`bootstrapLoginWithToken`) when there is no existing session, then strips the
  token from the URL. Later param-only URL updates re-run the loader with no
  token and no redirect, so the app can reuse a single WebView instance and
  re-render on `entityId`/`category`/`contentType` change without a full reload.
- **Focused REST endpoint** (`GET /api/notes-preview`): session-authenticated
  (`requireSessionUserId`) route → `handleGetNotesPreview` handler →
  `getNotesPreviewContent` service. The service dispatches to field-only
  helpers in `notesPreviewQueries.ts` (not the full learn-detail services) and
  returns `{ category, contentType, entityId, content }`. Mapping:
  `lecture/notes` → `lectures.notes` (+ Zoom-chat append), `lecture/summary` →
  `lectures_ai.summary`, `resource/notes` (and `resource/description` as an
  alias) → `body` (`notes ?? description` for `lectures.type = reading`),
  `assignment/instructions` (and `assignment/description` as an alias) →
  `instructions`. Any unsupported combination, or an invalid/missing
  `entityId`, returns `content: null` (HTTP 200) so the page shows an empty
  state and never crashes.
- **Client helper** (`src/lib/api/notes-preview/notesPreviewApi.ts`):
  `buildNotesPreviewPath` + `fetchNotesPreviewFromApi` (typed `fetchJson`
  wrapper; maps `ApiClientError` to a code-only `Error`).
- **Component** (`NotesPreviewV2`): reads params through `notesPreviewRouteApi`,
  fetches via React Query keyed on the params, and renders `MarkdownContent`.
  It also renders an optional header with `user.id` + `user.email` (from the
  route loader context) above the content when a session exists. States:
  `dash-skeleton` loading, rendered markdown, and a friendly empty state
  (reused for missing params, null/blank content, and fetch errors). Test hooks:
  `notes-preview-v2-root`, `-loading`, `-user`, `-content`, `-empty`.
- **Analytics exclusion** (`src/routes/__root.tsx`): GA/GTM scripts are gated by
  `ANALYTICS_EXCLUDED_PATHS` so they are skipped on `/notes-preview-v2`; Clarity
  is already excluded because the route is outside `_layout`.

## Test files

| Area                                                     | File                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Service field mapping / alias / unsupported / invalid id | `src/server/api/notes-preview/__tests__/notesPreview.service.test.ts`             |
| Lecture field-only queries (notes/summary)               | `src/server/api/notes-preview/__tests__/notesPreviewQueries.lecture.test.ts`      |
| Resource field-only query                                | `src/server/api/notes-preview/__tests__/notesPreviewQueries.resource.test.ts`     |
| Assignment field-only query                              | `src/server/api/notes-preview/__tests__/notesPreviewQueries.assignment.test.ts`   |
| Handler auth + query parsing + error mapping             | `src/server/api/notes-preview/__tests__/getNotesPreview.handler.test.ts`          |
| Not-found diagnostic probe reasons (lecture/resource)    | `src/server/api/notes-preview/__tests__/notesPreviewDiagnostics.test.ts`         |
| Client helper path building + error mapping              | `src/lib/api/notes-preview/__tests__/notesPreviewApi.test.ts`                     |
| Component loading / content / empty / error states       | `src/components/features/notes-preview/__tests__/NotesPreviewV2.test.tsx`         |

## Commands

```bash
npm run test -- src/server/api/notes-preview src/lib/api/notes-preview src/components/features/notes-preview
npm run typecheck
npm run lint
```

## Notes

- Assignments only carry `instructions`; there is no `description` column, so
  `contentType=description` is treated as an alias for `instructions`.
- Reading materials live in `lectures` with `type = reading` but are served as
  **resources** (`category=resource`), not lectures — `category=lecture` will
  404 them. Resource `contentType=notes` / `description` both map to `body`.
- Genuine access/not-found errors from the field-only queries surface as the API
  error (e.g. 404 `LEARN_DETAIL_NOT_FOUND` / unsupported-type codes), and the
  component renders its empty state on fetch failure — it never crashes on bad
  input.
- Coverage gap: the thin route file (`validateSearch` + `beforeLoad`) is not unit
  tested, matching the repo-wide convention that `src/routes/**` glue files are
  untested; all meaningful logic (service, handler, client, component) is covered.
