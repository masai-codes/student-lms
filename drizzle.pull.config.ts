import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Same precedence as Vite: `.env` then `.env.local` overrides.
loadEnv()
loadEnv({ path: '.env.local', override: true })

/**
 * Used only by `drizzle-kit pull` / `npm run db:pull`.
 *
 * Pull always writes into `out` (not `schema`). This config sets `out` to
 * `./src/db` so introspection overwrites the single app schema at
 * `src/db/schema.ts` (+ `relations.ts`).
 *
 * Generate / push / migrate keep using `drizzle.config.ts` (`out: ./drizzle`).
 *
 * Credentials: `PROD_DB_READ_URL` (prod read replica). Do not use `DATABASE_URL`
 * here — that stays local / app runtime.
 */
const prodDbReadUrl = process.env.PROD_DB_READ_URL

if (!prodDbReadUrl) {
  throw new Error(
    'PROD_DB_READ_URL is not set. Add the prod read replica URL to .env / .env.local before running npm run db:pull.',
  )
}

export default defineConfig({
  out: './src/db',
  dialect: 'mysql',
  dbCredentials: {
    url: prodDbReadUrl,
  },
})
