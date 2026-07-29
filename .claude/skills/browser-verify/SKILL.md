---
name: browser-verify
description: Run the Student LMS in the in-app Browser pane and verify a change actually works — start the dev server, log in as a seeded student via secret-login, drive the UI with data-testid selectors, and capture proof (screenshot / console / network). Use whenever asked to run the app, "see if it works", reproduce a UI bug, or confirm a frontend change in the real running app rather than only in unit tests.
---

# Browser Verify

Run the app the way a user would and prove the change works, using the Browser pane
tools (`mcp__Claude_Browser__*`). Never ask the user to check manually — verify and
share proof.

## When to use
- "Run the app" / "start the dev server" / "open it in the browser".
- "Does this work?" / "verify this change" / "show me a screenshot".
- Reproducing or confirming a fix for a UI bug.
Skip it when the change isn't observable in the browser (pure server/util/type/test
changes) — run `npm run test` / `npm run typecheck` instead.

## 1. Start the dev server
Use `preview_start` with the launch config name — **never** run the dev server with Bash.

```
preview_start { name: "student-lms" }
```

This runs `npm run dev` on **port 3002** (see `.claude/launch.json`). The result gives a
`tabId` (pass to page tools) and a `serverId` (only for `preview_logs` / `preview_stop`).
First boot compiles — if the page is blank, wait a few seconds and `navigate` to the URL
again, or check `preview_logs { level: "error" }`.

## 2. Log in (protected routes need a session)
App routes live under `(protected)` and require an auth cookie. Use the dev-only
secret-login backdoor to establish a real session — no password flow needed:

```
navigate { url: "http://localhost:3002/api/secret-login?token=<SECRET_LOGIN_TOKEN>&userId=<id>" }
```

- `SECRET_LOGIN_TOKEN` is read from `.env.local` (the route returns 503 if unset). Get the
  value with: `grep '^SECRET_LOGIN_TOKEN=' .env.local`. Treat it as a secret — never print
  it into chat or a committed file.
- Pass either `userId=<n>` or `email=<addr>`. Seeded students use the pattern
  `<flow-id>.student@example.com` (e.g. `dashboard-home.student@example.com`). List flows
  with `npm run seed -- --list`; seed data with `npm run seed:all` if the DB is empty.
- The route sets the cookie and 302s to `/`. After it lands you are authenticated; now
  `navigate` to the feature you're verifying (e.g. `/learn`, `/lectures/$id`).

## 3. Drive & inspect with data-testid
Prefer text-based tools over screenshots for assertions. Target elements by the project's
stable `data-testid` hooks (see CLAUDE.md → Automation Test Hooks), not by copy or CSS.

- `read_page` — accessibility tree with `ref_N` handles; confirm structure/content.
- `find { query }` — locate an element, returns a `ref`.
- `computer { action: "left_click", ref }` / `form_input { ref, value }` — interact.
- `read_console_messages { onlyErrors: true }` and `preview_logs { level: "error" }` —
  catch runtime/build errors.
- `read_network_requests { urlPattern: "/api/" }` — verify API calls & responses.
- `resize_window { preset: "mobile" }` and `{ colorScheme: "dark" }` — the guidelines
  require every screen to work from 320px up and in every theme; check both when layout or
  theming changed.

Example — assert the lecture listing rendered rows:
```
navigate { url: "http://localhost:3002/learn" }
read_page                      // look for [data-testid="learn-content-list"]
find { query: "lecture list item" }   // resolves [data-testid="lecture-list-item"]
```

## 4. If broken, fix and re-check
Read the source, edit the source file (never patch via `javascript_tool` — that's for
inspection only), then re-run from step 3. HMR usually reloads automatically; otherwise
`navigate` to the current URL again.

## 5. Share proof
Once it works, give the user evidence — don't just say "done":
- `computer { action: "screenshot" }` for visual changes.
- `read_network_requests` for API behavior; `preview_logs` for server behavior.

## Notes
- One Browser pane per session with tabs; `tabs_context` lists them, omit `tabId` to act on
  the fronted tab.
- Stop the server with `preview_stop { serverId }` only if asked; leaving it running is fine.
- Related: the `write-e2e` skill for authoring agenthand/Puppeteer suites against these
  same selectors.
