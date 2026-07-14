# Test-Data Seeding Framework

Layered seed infrastructure for local development and future integration/e2e tests.

## Prerequisites

- Local `.env` with `DATABASE_URL` pointing at a **non-production** dev database
- `NODE_ENV` must not be `production` (reset and seed are blocked in production)

## Run a flow

```bash
npm run seed login-and-join-lecture
```

Run every registered flow in one command (resets once, then appends each flow):

```bash
npm run seed:all
# equivalent:
npm run seed all
```

List available flows:

```bash
npm run seed
```

Skip database reset (append-only seed):

```bash
npm run seed login-and-join-lecture -- --no-reset
npm run seed onboarding-welcome-modal -- --no-reset
npm run seed onboarding-fees-unpaid -- --no-reset
npm run seed:all -- --no-reset
```

Compose every flow in one database — each flow uses **its own users, batch, sections, and lectures** (flow-scoped emails like `onboarding-welcome-modal.student@example.com`), so they never collide.

## Onboarding (T0) flows

| Flow ID                    | Starting UI state                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `login-and-join-lecture`   | Student can log in and join a live lecture                                                                                                  |
| `dashboard-home`           | Dashboard: My Schedule, Pending Tasks, Announcements, Product Updates (edge cases)                                                          |
| `onboarding-legacy-user`   | No T0 UI (no admission row)                                                                                                                 |
| `onboarding-welcome-modal` | Welcome modal on first login                                                                                                                |
| `onboarding-welcome-seen`  | Welcome modal already dismissed                                                                                                             |
| `onboarding-fees-unpaid`   | LMS Walkthrough test bed: 3 videos (play + auto-next), profile photo, download app — none pre-ticked; payment countdown; program tab locked |
| `onboarding-fees-paid`     | Program Onboarding unlocked; agreement/docs/kit states toggled via CLI flags (see below)                                                    |
| `onboarding-complete`      | All steps done, ID card unlocked                                                                                                            |
| `onboarding-fees-overdue`  | Fee deadline passed, still unpaid                                                                                                           |

```bash
npm run seed onboarding-welcome-modal
```

LMS walkthrough lectures use real S3 recordings mapped by section name (`LMS Walkthrough - Web` / `LMS Walkthrough - App`).

### Testing LMS Walkthrough (videos / photo / app)

```bash
npm run seed onboarding-fees-unpaid
# Login: onboarding-fees-unpaid.student@example.com / password
# Or open http://localhost:3002/seed-catalog/ → Login on this flow
```

What you get on this student:

| Step          | Seeded state                                          | How to complete in UI                                                                        |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 3 LMS videos  | Not watched — playable S3 URLs, ordered for auto-next | Watch ≥10s to tick; let each video end to auto-advance to the next                           |
| Profile photo | Not set                                               | Webcam capture → writes `profiles.meta.profile_pic`                                          |
| Download app  | No `user_device_tokens`                               | Step stays open until a device token exists (real app register, or insert a token + refresh) |
| Program tab   | Locked (`full_fees_paid = 0`)                         | Use `onboarding-fees-paid` to test that tab                                                  |

To pre-complete the **Download app** step (seed a `user_device_tokens` row):

```bash
npm run seed onboarding-fees-unpaid -- --with-app-download
```

### Testing Program Onboarding (agreement / documents / kit / ID card)

`onboarding-fees-paid` unlocks the Program Onboarding tab. Documents and
Student Kit are **not** driven by `batch_info` here — they're driven by a
simulated "onward" `/lms/student-status` response, modeled in
`seed/onward-simulation/` after the real onward admissions API contract:

```
{
  "documents": { "required": bool, "documentsUploaded": bool, ... },
  "kit": { "showKit": bool, "detailsFilled": bool, "tracking": string|null, ... }
}
```

```bash
npm run seed onboarding-fees-paid
# Login: onboarding-fees-paid.student@example.com / password
```

Base state: agreement pending, `documents.required = true` (not uploaded), `kit.showKit = true` (not filled, no tracking).

Common states (replaces the old `onboarding-agreement-pending`, `onboarding-kit-waiting`, and `onboarding-kit-tracking` flows):

| State                       | Command                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Agreement pending (default) | `npm run seed onboarding-fees-paid`                                                               |
| Kit filled, no tracking     | `npm run seed onboarding-fees-paid -- --agreement-signed --kit-shown --kit-filled`                |
| Kit with tracking URL       | `npm run seed onboarding-fees-paid -- --agreement-signed --kit-shown --kit-filled --kit-tracking` |

Optional flags layer on top of that base state:

| Flag                 | Effect                                                                                |
| -------------------- | ------------------------------------------------------------------------------------- |
| `--docs-required`    | Simulated onward: `documents.required = true`                                         |
| `--docs-uploaded`    | Simulated onward: `documents.documentsUploaded = true`                                |
| `--kit-shown`        | Simulated onward: `kit.showKit = true`                                                |
| `--kit-filled`       | Simulated onward: `kit.detailsFilled = true`                                          |
| `--kit-tracking`     | Simulated onward: `kit.tracking = <example tracking URL>`                             |
| `--agreement-signed` | Pre-signs the Program Onboarding - Web POSH agreement (unlocks Documents + Kit steps) |

```bash
npm run seed onboarding-fees-paid -- --docs-required --docs-uploaded --kit-shown --kit-filled --kit-tracking --agreement-signed
```

**What actually reads this today:**

- **Student Kit** — the seed mirrors `kit.showKit` / `kit.detailsFilled` / `kit.tracking` into `user_batch_admission_data` (`studentKitExists` / `studentKitDetailsFilled` / `studentKitTrackingUrl`), which is what `getStudentKitStatus.service.ts` actually reads. So Student Kit renders correctly today, with no app-code changes.
- **Documents** — `getT0FlowDocuments.service.ts` calls the real onward `/lms/student-status` endpoint via `getAdmissionsStudentStatus`. To make `documentsUploaded` genuinely dynamic in local dev, run the local mock and point env at it:

  ```bash
  npx tsx seed/onward-simulation/onwardMockServer.ts
  # then in .env.local:
  # ADMISSIONS_API_BASE_URL=http://localhost:4500
  # ADMISSIONS_API_KEY=anything (must match on both sides)
  ```

  Note: the running app currently decides Documents-step **visibility** from `batch_info`, not from `documents.required` — that would need a small follow-up change in `getT0FlowLectures.service.ts` to fully honor the `--docs-required` flag. This seed only writes the simulated fixture (via `seed/onward-simulation/`); it does not seed `batch_info`.

- **ID card** — unlock logic is unchanged: still just LMS videos watched + agreement signed. Documents/Kit completion is not required to unlock it.

### Testing Dashboard home (schedule / pending / announcements / product updates)

```bash
npm run seed dashboard-home
# Login: dashboard-home.student@example.com / password
# Or open http://localhost:3002/seed-catalog/ → Login on this flow
```

| Area                | Visible on dashboard                                                                                    | Also seeded but hidden (edge-case exclusions)                     |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **My Schedule**     | 2 lectures (today + day 3), 2 assignments (yesterday incomplete + day 5); empty days in between       | Catch-up lecture (past, pending-only)                             |
| **Pending Tasks**   | Catch-up lecture + open assignment (badge `2`)                                                          | Started assignment, overdue assignment, optional catch-up lecture |
| **Announcements**   | 3 section + 2 For You (= cap of 5)                                                                      | Read, expired, future announcements                               |
| **Product Updates** | Newest 5 of 7 `whatsnew` rows                                                                           | —                                                                 |

Student has **no admission row** so the T0 guided-tour overlay does not block the dashboard.

## Catalog page

Generate the HTML catalog from the registry (never edit `index.html` by hand):

```bash
npm run seed:catalog
```

Open **http://localhost:3002/seed-catalog/** while the dev server is running so Login can reach `/api/secret-login`.

After seeding, the CLI also refreshes `seed/catalog/index.html` and writes `seed/catalog/seed-state.json` with the latest user IDs for Login buttons.

Set `SECRET_LOGIN_TOKEN` in `.env.local` before generating the catalog so Login buttons are enabled.

## Programmatic use (tests)

```ts
import { seedFlow } from '../seed'

const { entities, testUsers } = await seedFlow('login-and-join-lecture')
// testUsers[1] is the student; entities.lecture.id is the joinable lecture
```

Pass `{ reset: false }` to skip truncation when composing multiple steps.

## Architecture

```
seed/factories/   — atomic entity creators (no flow knowledge)
seed/flows/       — scenario composers (one file per flow)
seed/registry.ts  — single source of truth for flow metadata
seed/index.ts     — seedFlow(), resetDatabase() public API
seed/runner/      — CLI entry
seed/catalog/     — HTML generator from registry
```

## Add a factory

1. Create `seed/factories/createThing.ts` with `createThing(overrides?)`.
2. Import Drizzle table from `@/db/schema`, insert via `@/db`, return the created row.
3. Export from `seed/factories/index.ts`.

Factories must **never** import from `seed/flows/`.

Datetime fields use naive **IST** (`Asia/Kolkata`) strings via `formatMysqlDatetime` / `formatMysqlDate`, matching how the LMS reads schedule values.

## Add a flow

1. Create `seed/flows/my-flow/config.ts` with machine-readable `meta` (id, description, timing, seedCommand).
2. Create `seed/flows/my-flow/seed.ts` composing factories; return `SeedFlowResult` with `testUsers` from inserted rows.
3. Register the config in `seed/registry.ts` and add a case to `loadFlowModule`.
4. Run `npm run seed:catalog` to refresh the catalog.

**Isolation rule:** every flow must create its own users, batch, sections, and lectures. Use flow-scoped emails (`{flowId}.student@example.com`) and batch names. Flows must work when every command is run with `--no-reset` in sequence — never reuse hardcoded shared rows across flows.

## Database reset

`resetDatabase()` truncates **all** app-data tables in the connected schema, preserving only `_prisma_migrations`. Use only against local/dev test databases.
