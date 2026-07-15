import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Same precedence as Vite: `.env` then `.env.local` overrides.
loadEnv()
loadEnv({ path: '.env.local', override: true })

/**
 * Default Kit config for generate / push / migrate.
 * Schema source of truth: `src/db/schema.ts`.
 * Migrations output: `drizzle/` (SQL + meta only — no schema twin).
 *
 * For introspecting a remote DB into that same schema file, use
 * `drizzle.pull.config.ts` via `npm run db:pull`. See docs/db-schema-sync.md.
 */
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Add your local DB URL to .env / .env.local before running npm run db:push / db:generate.',
  )
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: databaseUrl,
  },
})
