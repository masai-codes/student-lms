/**
 * Applies a single Drizzle-generated `.sql` migration file directly against
 * DATABASE_URL, splitting on drizzle-kit's `--> statement-breakpoint` marker.
 *
 * `drizzle-kit migrate` replays the ENTIRE journal from 0000, but this DB's
 * schema was reverse-engineered from a pre-existing MySQL instance and 0000
 * was never applied here — replaying it would fail against tables that
 * already exist. This script applies one reviewed file at a time instead,
 * which is also what gets handed to the user for production.
 *
 * Usage: node scripts/apply-migration.mjs drizzle/0001_interview_sessions.sql
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const root = process.cwd()
dotenv.config({ path: resolve(root, '.env') })
dotenv.config({ path: resolve(root, '.env.local'), override: true })

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/apply-migration.mjs <path-to-sql-file>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = readFileSync(resolve(root, file), 'utf8')
const statements = sql
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

const connection = await mysql.createConnection({ uri: databaseUrl })

try {
  for (const statement of statements) {
    console.log(`Applying:\n${statement}\n`)
    await connection.query(statement)
  }
  console.log(`Applied ${statements.length} statement(s) from ${file}`)
} finally {
  await connection.end()
}
