# Database schema sync (Drizzle)

We keep **one** schema source of truth: `src/db/schema.ts` (plus `src/db/relations.ts` when present).

| File / folder | Role |
|---------------|------|
| `src/db/schema.ts` | App + Kit schema (imports, `generate`, `push`) |
| `src/db/relations.ts` | Relations; also rewritten by `pull` |
| `drizzle/` | Migration SQL + `meta/` only |
| `drizzle.config.ts` | `generate` / `push` / `migrate` |
| `drizzle.pull.config.ts` | `pull` only — writes into `src/db/` |

`drizzle-kit pull` always writes into `out`, not `schema`. That is why pull uses a separate config with `out: './src/db'`.

---

## Important

- **Never merge a pull PR without review.** Pull overwrites the whole schema file and can drop app-only tables or add unused ones.
- **Never `push` against prod.** Push is for local (or an explicitly chosen writable environment) only.
- **Pull / push sync structure only** — not row data. Use dump/restore if you need data.

---

## Pull schema from prod (read replica) into `src/db/schema.ts`

1. Set **`PROD_DB_READ_URL`** to the prod read replica (read-only is fine).  
   Leave `DATABASE_URL` pointed at local / app runtime — pull does not use it.

   ```bash
   export PROD_DB_READ_URL="mysql://USER:PASS@PROD_READ_HOST:3306/DATABASE"
   ```

   Or add it to `.env` / `.env.local` (gitignored) — do not commit prod credentials.

2. Run pull (overwrites `src/db/schema.ts` and `src/db/relations.ts`):

   ```bash
   npm run db:pull
   ```

   Equivalent:

   ```bash
   npx drizzle-kit pull --config=drizzle.pull.config.ts
   ```

3. **Review the diff** before anything else:

   ```bash
   git diff src/db/schema.ts src/db/relations.ts
   ```

   Restore any app-only tables or intentional tweaks that prod does not have yet (for example tables added only in this repo).

4. Open a PR. Do **not** merge until reviewed. Do **not** apply to any shared DB from an unreviewed pull.

---

## Apply that schema to your local DB

After the reviewed schema is what you want locally:

1. Point `DATABASE_URL` at **local** MySQL (writable).

   ```bash
   export DATABASE_URL="mysql://root:PASS@127.0.0.1:3306/YOUR_LOCAL_DB"
   ```

   Example if you use the repo Docker DB: start it with `npm run db:up`, then use the local URL from your `.env` / `scripts/db` setup.

2. Push structure from `src/db/schema.ts` to local:

   ```bash
   npm run db:push
   ```

   Equivalent:

   ```bash
   npx drizzle-kit push --config=drizzle.config.ts
   ```

3. Review Kit’s proposed DDL prompts carefully (creates / alters / drops) before confirming.

---

## End-to-end cheat sheet

```bash
# Introspect prod (structure → TypeScript). Uses PROD_DB_READ_URL only.
export PROD_DB_READ_URL="<prod-read-url>"
npm run db:pull
git diff src/db/schema.ts src/db/relations.ts   # review; fix app-only bits
# commit + PR — merge only after review

# Apply to local (TypeScript → local MySQL). Uses DATABASE_URL.
export DATABASE_URL="<local-writable-url>"
npm run db:push
```

---

## Making schema changes in the app (normal workflow)

For features that own DDL in this repo:

1. Edit `src/db/schema.ts`.
2. Generate a migration (optional but preferred for shared envs):

   ```bash
   npm run db:generate
   ```

3. Apply locally with `npm run db:push`, or run the generated SQL / migrate against the target DB using your team’s process.

Do not reintroduce a second schema under `drizzle/`.
