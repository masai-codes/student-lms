# Notes Preview WebView — Content-by-ID

The in-app "notes preview" WebView currently receives rendered markdown content
pushed in via `postMessage` after the page loads. It's moving to a
content-by-ID model: the app passes `category` + `contentType` + `entityId`
(+ auth `token`) in the URL, and the web page fetches and renders the content
itself.

This also moves the page from the old LMS web app to the new LMS
(`EXPO_PUBLIC_STUDENTS_NEW_URL`, e.g. `learn.masaischool.com`), matching where
`/support-page` already lives.

> Scope note: this covers lecture notes/AI summary, reading resources
> (`lectures.type = reading`), and assignment description/instructions only.
> Support chat messages are out of scope and stay on the existing `postMessage`
> content-push flow.

## URL

```
{NEW_LMS_BASE_URL}/notes-preview?token={token}&category={category}&contentType={contentType}&entityId={entityId}
```

Example:

```
https://learn.masaischool.com/notes-preview?token=eyJhbGciOi...&category=lecture&contentType=notes&entityId=157894
```

## Params

| Param | Type | Required | Values |
|---|---|---|---|
| `token` | string | yes | Bootstrap JWT identifying the student — use it to authenticate your own fetch of the entity's content, the same way `/support-page` does today. |
| `category` | string | yes | `lecture`, `resource`, `assignment` |
| `contentType` | string | yes | See mapping below — depends on `category` |
| `entityId` | string \| number | yes | ID of the lecture or assignment, e.g. `157894` |

## Category × contentType mapping

| `category` | `contentType` | Content | Equivalent to app field |
|---|---|---|---|
| `lecture` | `notes` | Lecture notes | `lecture.notes` |
| `lecture` | `summary` | Lecture AI summary | `lecture.lectures_ai[0].summary` |
| `resource` | `notes` | Reading resource body | `resource.body` (`notes` ?? `description`; `lectures.type = reading`) |
| `resource` | `description` | Alias for resource body | same as `notes` |
| `assignment` | `description` | Assignment description | `assignment.description` (alias → `instructions`) |
| `assignment` | `instructions` | Assignment instructions | `assignment.instructions` |

> Reading materials (`type = reading`) must use `category=resource`, not
> `category=lecture` — the lecture detail path excludes reading rows.

Any other `category`/`contentType` combination, or a missing `entityId`, should
show an empty/error state — do not crash.

## Behavior

1. Read `token`, `category`, `contentType`, `entityId` from the query string on load.
2. Using `token` for auth, call `GET /api/notes-preview` (session cookie after bootstrap). The API selects **only the requested markdown field** (not a full lecture/resource/assignment detail payload), applying the same access guards and text transforms as the learn detail pages:
   - `category=lecture` + `contentType=notes` → `lectures.notes` (+ Zoom-chat "Resources shared" links)
   - `category=lecture` + `contentType=summary` → `lectures_ai.summary`
   - `category=resource` → reading-resource `body` (`notes ?? description`)
   - `category=assignment` → `assignments.instructions` (`description` is an alias)
3. Render the returned markdown as HTML in place of what previously came from `postMessage`.

## Why this matters for load time

The app keeps a single WebView instance alive and reuses it across opens
(same approach as `/support-page`). Please make sure:
- The page can re-render new content when `entityId`/`category`/`contentType`
  change via client-side navigation (e.g. React Router / query param change),
  **without requiring a full page reload**, since the app may update the URL
  on an already-loaded WebView instance instead of remounting it.
- Static JS/CSS assets are served with long-lived, immutable cache headers
  (`Cache-Control: public, max-age=31536000, immutable`) so repeat loads
  don't re-download the full app bundle.
- Any analytics/tracking scripts (GTM, Clarity, etc.) that aren't needed for
  this specific preview view are excluded from this route.

## Open questions (please confirm before implementing)

1. **Auth token type** — is the existing bootstrap JWT (`/jwt-token/generate`)
   sufficient for your API to authorize a content fetch by lecture/assignment
   ID, or do you need a different token/scope?
