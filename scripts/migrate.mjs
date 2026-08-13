/**
 * Applies pending Drizzle migrations from ./drizzle, tracked in the
 * `__drizzle_migrations` table (standard drizzle-orm migrator).
 *
 * One extra behaviour on top of the stock migrator — auto-baseline:
 * this app's schema predates migration tracking (it was reverse-engineered
 * from a live MySQL DB), so on a database that already has the app tables
 * but no `__drizzle_migrations` rows, the FIRST journal entry (the `0000`
 * baseline snapshot) is marked as applied WITHOUT running it. On a truly
 * empty database the baseline runs for real and creates every table.
 * Either way, everything after 0000 is applied normally and recorded.
 *
 * DATABASE_URL resolution: a value already set in the shell wins (so
 * `DATABASE_URL=... npm run db:migrate` targets exactly that DB), otherwise
 * .env then .env.local, matching the rest of the repo's scripts.
 *
 * Usage: npm run db:migrate
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'

const root = process.cwd()
const urlFromShell = process.env.DATABASE_URL
dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local'), override: true })
const databaseUrl = urlFromShell ?? process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const MIGRATIONS_FOLDER = resolve(root, 'drizzle')
const TRACKING_TABLE = '__drizzle_migrations'

const journal = JSON.parse(
  readFileSync(resolve(MIGRATIONS_FOLDER, 'meta/_journal.json'), 'utf8'),
)

const connection = await mysql.createConnection({ uri: databaseUrl })

async function lastAppliedMillis() {
  const [rows] = await connection.query(
    `select created_at from \`${TRACKING_TABLE}\` order by created_at desc limit 1`,
  )
  return rows.length > 0 ? Number(rows[0].created_at) : null
}

try {
  const target = new URL(databaseUrl)
  console.log(`Target: ${target.hostname}${target.pathname}`)

  await connection.query(
    `create table if not exists \`${TRACKING_TABLE}\` (
       id serial primary key,
       hash text not null,
       created_at bigint
     )`,
  )

  // Auto-baseline: existing schema, empty tracking table.
  if ((await lastAppliedMillis()) === null) {
    const [existing] = await connection.query(`show tables like 'users'`)
    if (existing.length > 0) {
      const baseline = journal.entries[0]
      const sql = readFileSync(
        resolve(MIGRATIONS_FOLDER, `${baseline.tag}.sql`),
        'utf8',
      )
      const hash = createHash('sha256').update(sql).digest('hex')
      await connection.query(
        `insert into \`${TRACKING_TABLE}\` (hash, created_at) values (?, ?)`,
        [hash, baseline.when],
      )
      console.log(
        `Existing schema with no migration history — marked ${baseline.tag} as already applied (not run).`,
      )
    }
  }

  const last = await lastAppliedMillis()
  const pending = journal.entries.filter((e) => last === null || e.when > last)
  if (pending.length === 0) {
    console.log('No pending migrations.')
  } else {
    console.log(`Applying ${pending.length} migration(s):`)
    for (const e of pending) console.log(`  - ${e.tag}`)
  }

  await migrate(drizzle(connection), { migrationsFolder: MIGRATIONS_FOLDER })

  if (pending.length > 0) console.log('Done.')
} finally {
  await connection.end()
}
