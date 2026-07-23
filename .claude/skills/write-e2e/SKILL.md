---
name: write-e2e
description: Author or update end-to-end / browser automation flows for the Student LMS using agenthand (Puppeteer-based) that drive the real app and assert on stable data-testid selectors. Use when asked to write an e2e test, browser test, automation flow, smoke test, or "add a test that clicks through X", or when adding the selectors those tests depend on. For rendering unit tests use vitest + Testing Library instead.
---

# Write E2E (agenthand / Puppeteer)

Automation suites (agenthand, which wraps Puppeteer) drive the running app and select
elements by **`data-testid`**. This skill covers making elements selectable and writing the
flows. It pairs with `browser-verify` (running & manually confirming the app).

## Selector contract — the one rule
Automation targets `data-testid` **only**. Do NOT add `id`s or CSS class names for testing,
and never key styling off a test id (see CLAUDE.md → Automation Test Hooks).

- Naming: kebab-case, feature-prefixed — `data-testid="<feature>-<element>"`.
- Repeated rows: reuse one id and query all; suffix a stable domain id when one exists.
  - Listing rows are keyed by content type so a suite can target one kind:
    `[data-testid="lecture-list-item"]`, `assignment-list-item`, `resource-list-item`
    (see `src/components/features/learn/section-three/LearnContentListSection.tsx`), each
    also carrying `data-content-id={id}`.
  - Container roots get their own id too: `[data-testid="learn-content-list"]`, and the
    empty state `[data-testid="learn-content-list-empty"]`.
- Every meaningful element needs one: section/container roots, interactive controls
  (buttons, tabs, links, inputs), repeated list items, key text/status elements. When a
  flow needs a hook that doesn't exist yet, **add the `data-testid` to the component in the
  same change** — don't fall back to brittle text/CSS selectors.

## Auth in automation
Protected routes need a session. Establish one by navigating to the secret-login backdoor
before the flow (same mechanism as `browser-verify`):

```
GET http://localhost:3002/api/secret-login?token=${SECRET_LOGIN_TOKEN}&userId=${USER_ID}
```

- Read `SECRET_LOGIN_TOKEN` from the environment (`.env.local`) — never hardcode it into a
  committed test. Pass it via env/CI secret.
- Use a seeded student (`<flow-id>.student@example.com`). Seed with `npm run seed:all`.

## Flow shape
1. Launch the browser (agenthand) → base URL `http://localhost:3002`.
2. Navigate to `/api/secret-login?...` to authenticate, then to the feature route.
3. Wait for the container testid, act on rows/controls by testid, assert on visible
   testid'd elements. Prefer `page.waitForSelector('[data-testid="..."]')` over fixed sleeps
   so runs stay deterministic (project testing rule: no timing-sensitive assertions).
4. Assert both the positive path and one edge/empty state
   (`learn-content-list-empty`).

Sketch (Puppeteer API, agenthand exposes the same surface):
```js
await page.goto(`${BASE}/api/secret-login?token=${process.env.SECRET_LOGIN_TOKEN}&userId=${USER_ID}`, { waitUntil: 'networkidle0' })
await page.goto(`${BASE}/learn`, { waitUntil: 'networkidle0' })
await page.waitForSelector('[data-testid="learn-content-list"]')
const lectures = await page.$$('[data-testid="lecture-list-item"]')
expect(lectures.length).toBeGreaterThan(0)
await lectures[0].click()
await page.waitForSelector('[data-testid="lecture-detail-page"]') // add this testid if missing
```

## Before you finish
- If you added or changed selectors/behavior, update the testing docs in the same change
  (CLAUDE.md → Testing Documentation): `docs/testing/feature-test-matrix.md` and
  `docs/testing/features/<feature>.md`.
- Keep `npm run test`, `npm run lint`, `npm run typecheck` green for touched code.
- Manually confirm the flow works via the `browser-verify` skill before relying on it.
