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

| Flow ID | Starting UI state |
|---------|-------------------|
| `onboarding-legacy-user` | No T0 UI (no admission row) |
| `onboarding-welcome-modal` | Welcome modal on first login |
| `onboarding-welcome-seen` | Welcome modal already dismissed |
| `onboarding-fees-unpaid` | LMS walkthrough + payment countdown |
| `onboarding-fees-paid` | Program onboarding unlocked, steps pending |
| `onboarding-kit-waiting` | Kit filled, no tracking yet |
| `onboarding-kit-tracking` | Kit tracking URL visible |
| `onboarding-agreement-pending` | Agreement modal still open |
| `onboarding-complete` | All steps done, ID card unlocked |
| `onboarding-fees-overdue` | Fee deadline passed, still unpaid |

```bash
npm run seed onboarding-welcome-modal
```

LMS walkthrough lectures use real S3 recordings mapped by section name (`LMS Walkthrough - Web` / `LMS Walkthrough - App`).

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
