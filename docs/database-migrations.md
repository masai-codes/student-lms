# Database migrations (Drizzle)

Standard drizzle-kit workflow, tracked in a `__drizzle_migrations` table in the
target database. Three commands cover everything:

| Command               | What it does                                                                                                                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:pull`     | Introspect the **prod read replica** (`PROD_READ_ONLY_DATABASE_URL`, falls back to `DATABASE_URL`; managed tables only) and rewrite `src/db/schema.ts`. Use to **adopt changes made outside this app**. Managed tables missing from the DB (pending migrations not yet on prod) are preserved from the previous schema. |
| `npm run db:generate` | Diff `src/db/schema.ts` against the last snapshot in `drizzle/meta/` and write a new SQL migration file to `drizzle/`.                                                                                                                                                                                                  |
| `npm run db:status`   | Dry run: show which migrations are applied vs pending on the target DB, print the exact SQL that would run, and flag destructive statements.                                                                                                                                                                            |
| `npm run db:migrate`  | Apply all migrations not yet recorded in `__drizzle_migrations` on the target DB (`DATABASE_URL` from the shell, else `.env.local`/`.env`).                                                                                                                                                                             |

Migrations are matched by **content hash** (sha256 of the file), not by
timestamp, so regenerating or renaming unapplied files can't confuse the
tracker. Corollary: never edit an applied file — the hash won't match and it
would count as pending again.

## Day-to-day: making a schema change

1. Edit `src/db/schema.ts` (add a column, table, index…). If it's a brand-new
   table, also add its SQL name to `src/db/managedTables.ts`.
2. `npm run db:generate` — review the generated SQL file in `drizzle/`.
3. `npm run db:status` — see exactly what will run against the target DB
   (destructive statements are flagged with ⚠️).
4. `npm run db:migrate` — applies it and records it. Running it again is a
   no-op ("No pending migrations.").

To ship the change to another environment (e.g. production), run the same
`db:migrate` with that environment's `DATABASE_URL`:

```sh
DATABASE_URL='mysql://…' npm run db:migrate
```

The tracking table means each migration runs exactly once per database, in
order, no matter who runs it or when they last pulled.

## Adopting changes made outside this app

The DB is shared; other services alter tables too. When that happens:

1. `npm run db:pull` — rewrites `src/db/schema.ts` from the live DB and
   reapplies the timezone-safe column types (`scripts/sync-schema.mjs`).
2. Commit the schema diff. **Do not** run `db:generate` for these changes —
   they already exist in the DB; generating would produce SQL that fails or,
   worse, gets replayed elsewhere.

`db:generate` is only for changes that _originate_ in `schema.ts`.

## How the baseline works

The schema predates migration tracking (it was reverse-engineered from a live
MySQL DB), so `drizzle/0000_baseline.sql` is a snapshot of the managed schema
as introspected from the **prod read replica** on 2026-08-13.
`scripts/migrate.mjs` handles it automatically:

- **DB that already has the tables** (prod, shared dev RDS, local copies): on
  first run it marks `0000_baseline` as applied _without executing it_, then
  applies anything newer. Nothing to do manually.
- **Empty DB** (fresh local MySQL): the baseline executes for real and creates
  all managed tables.

`0001_interview_sessions` covers the one table dev had but prod didn't at
baseline time. It's written as `CREATE TABLE IF NOT EXISTS` so it no-ops on
dev DBs and creates the table on prod — the auto-baseline marks `0000` only,
so every DB gets `0001` exactly once either way.

## Notes & sharp edges

- `drizzle-kit push` was removed on purpose: it diffs `schema.ts` against the
  live DB and applies DDL immediately, with no file, no review, and no
  tracking — too dangerous against a shared database.
- `drizzle-kit pull` does not preserve the DB's original FK constraint names
  (it emits inline `.references()`), so generated FK names follow drizzle's
  convention and can exceed MySQL's 64-char identifier limit.
  `scripts/fix-migration-identifiers.mjs` (part of `db:generate`) shortens
  them deterministically. Related: a generated `DROP FOREIGN KEY` will use the
  convention name, which may not match the real constraint name on an old
  shared DB — review those by hand.
- Never edit an already-applied migration file: its sha256 is recorded in
  `__drizzle_migrations`, and drizzle applies strictly by journal timestamp.
  Fix mistakes with a new migration.
- Re-baselining (regenerating `0000`) requires truncating `__drizzle_migrations`
  on every target DB first — avoid unless the history is genuinely broken.
