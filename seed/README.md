# Test-Data Seeding Framework

Layered seed infrastructure for local development and future integration/e2e tests.

## Prerequisites

- Local `.env` with `DATABASE_URL` pointing at a **non-production** dev database
- `NODE_ENV` must not be `production` (reset and seed are blocked in production)

## Run a flow

```bash
npm run seed login-and-join-lecture
```

List available flows:

```bash
npm run seed
```

Skip database reset (append-only seed):

```bash
npm run seed login-and-join-lecture -- --no-reset
```

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

## Database reset

`resetDatabase()` truncates **all** app-data tables in the connected schema, preserving only `_prisma_migrations`. Use only against local/dev test databases.
