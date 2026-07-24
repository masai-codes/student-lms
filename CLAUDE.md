# Student LMS Experience

Project coding, testing, styling, and API guidelines are the single source of
truth shared with Cursor. They live in `.cursor/rules/` and are imported below
so Claude Code (and any agent reading this file) follows the same standards.

@.cursor/rules/project-coding-guidelines.mdc

## Running & verifying the app in a browser

The dev server runs on **port 3002** (`npm run dev`, config in `.claude/launch.json`).
Prefer the Browser pane (`preview_start { name: "student-lms" }`) over Bash for running it.

Two project skills automate this — invoke them via the Skill tool:

- **`browser-verify`** — start the app, log in as a seeded student, drive the UI by
  `data-testid`, and capture proof. Use whenever asked to run the app, reproduce a UI bug,
  or confirm a frontend change works in the real running app (not just unit tests).
- **`write-e2e`** — author/update agenthand (Puppeteer) automation flows and the
  `data-testid` selectors they depend on.

**Auth for local/automation:** protected routes need a session. Use the dev-only backdoor
`GET /api/secret-login?token=<SECRET_LOGIN_TOKEN>&userId=<id>` (token from `.env.local`;
seeded students are `<flow-id>.student@example.com`, seed with `npm run seed:all`). Treat
`SECRET_LOGIN_TOKEN` as a secret — never print or commit it.

**Automation selectors are `data-testid` only** (already the repo convention on 120+ files;
see the coding guidelines' "Automation Test Hooks"). agenthand/Puppeteer target
`[data-testid="..."]`. Do not add `id`s or test-only class names. Example: lecture listing
rows expose `[data-testid="lecture-list-item"]` (also `assignment-list-item` /
`resource-list-item`, each with `data-content-id`), under container
`[data-testid="learn-content-list"]`.
For a full architecture walkthrough, feature-building checklist, and
anti-patterns to avoid, see `AGENTS.md` in this directory.
