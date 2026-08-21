/**
 * Applies pending Drizzle migrations from ./drizzle, tracked by content hash
 * in the `__drizzle_migrations` table.
 *
 *   npm run db:status    — show applied/pending + the exact SQL that would run
 *   npm run db:migrate   — apply pending migrations
 *
 * Differences from the stock drizzle-orm migrator (which this replaces):
 *
 * - **Hash-based, not timestamp-based.** A migration is "applied" iff its
 *   file's sha256 is recorded. The stock migrator compares journal timestamps
 *   against the last recorded row, which re-applies everything if the
 *   baseline is ever regenerated with a newer timestamp.
 * - **Auto-baseline.** The schema predates migration tracking, so if the
 *   FIRST journal entry (the `0000` baseline snapshot) is unapplied but the
 *   DB already has the app's tables (sentinel: `users`), it is recorded
 *   WITHOUT being executed. On an empty DB it runs for real.
 * - **Destructive-statement warnings.** DROP/TRUNCATE/DELETE in pending SQL
 *   is flagged in both status and migrate output.
 *
 * DATABASE_URL resolution: a value already set in the shell wins (so
 * `DATABASE_URL=… npm run db:migrate` targets exactly that DB), otherwise
 * .env then .env.local, matching the rest of the repo's scripts.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const statusOnly = process.argv.includes('--status')

const root = process.cwd()
const urlFromShell = process.env.DATABASE_URL
dotenv.config({ path: resolve(root, '.env'), quiet: true })
dotenv.config({
  path: resolve(root, '.env.local'),
  override: true,
  quiet: true,
})
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

const migrations = journal.entries.map((entry) => {
  const sql = readFileSync(
    resolve(MIGRATIONS_FOLDER, `${entry.tag}.sql`),
    'utf8',
  )
  return {
    ...entry,
    sql,
    hash: createHash('sha256').update(sql).digest('hex'),
    statements: sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean),
  }
})

const destructiveStatements = (migration) =>
  migration.statements.filter((s) =>
    /^\s*(drop\s|truncate\s)|\balter\s+table\b[\s\S]*\bdrop\b|^\s*delete\s+from\b/i.test(
      s,
    ),
  )

/**
 * Extract what each DROP statement targets, so it can be checked against the
 * DB before anything runs.
 *
 * Worth doing because `drizzle-kit pull` discards the DB's real FK constraint
 * names (see docs/database-migrations.md), so a generated
 * `DROP FOREIGN KEY <convention_name>` can name a constraint that prod calls
 * something else — which otherwise fails halfway through a migration.
 *
 * `IF EXISTS` targets are skipped: they are already no-ops when absent.
 */
function dropTargets(statement) {
  const targets = []
  const push = (kind, table, name) => targets.push({ kind, table, name })
  const clean = (s) => s?.replace(/[`;]/g, '')

  for (const m of statement.matchAll(
    /alter\s+table\s+`?([\w.]+)`?\s+drop\s+foreign\s+key\s+`?([\w$]+)`?/gi,
  )) {
    push('foreign key', clean(m[1]), clean(m[2]))
  }
  for (const m of statement.matchAll(
    /alter\s+table\s+`?([\w.]+)`?\s+drop\s+index\s+`?([\w$]+)`?/gi,
  )) {
    push('index', clean(m[1]), clean(m[2]))
  }
  for (const m of statement.matchAll(
    /drop\s+index\s+`?([\w$]+)`?\s+on\s+`?([\w.]+)`?/gi,
  )) {
    push('index', clean(m[2]), clean(m[1]))
  }
  for (const m of statement.matchAll(
    /alter\s+table\s+`?([\w.]+)`?\s+drop\s+(?:column\s+)?(?!foreign\b|index\b|constraint\b|primary\b|key\b|check\b)`?([\w$]+)`?/gi,
  )) {
    push('column', clean(m[1]), clean(m[2]))
  }
  for (const m of statement.matchAll(
    /drop\s+table\s+(?!if\s+exists)`?([\w.]+)`?/gi,
  )) {
    push('table', clean(m[1]), null)
  }
  return targets
}

/** Does the DROP target actually exist on the connected DB? */
async function dropTargetExists(connection, { kind, table, name }) {
  const queries = {
    'foreign key': [
      `select 1 from information_schema.referential_constraints
       where constraint_schema = database() and table_name = ? and constraint_name = ? limit 1`,
      [table, name],
    ],
    index: [
      `select 1 from information_schema.statistics
       where table_schema = database() and table_name = ? and index_name = ? limit 1`,
      [table, name],
    ],
    column: [
      `select 1 from information_schema.columns
       where table_schema = database() and table_name = ? and column_name = ? limit 1`,
      [table, name],
    ],
    table: [
      `select 1 from information_schema.tables
       where table_schema = database() and table_name = ? limit 1`,
      [table],
    ],
  }
  const [sql, params] = queries[kind]
  const [rows] = await connection.query(sql, params)
  return rows.length > 0
}

const describeTarget = ({ kind, table, name }) =>
  kind === 'table'
    ? `table \`${table}\``
    : `${kind} \`${name}\` on \`${table}\``

const connection = await mysql.createConnection({ uri: databaseUrl })

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

  const [rows] = await connection.query(
    `select hash from \`${TRACKING_TABLE}\``,
  )
  const appliedHashes = new Set(rows.map((r) => r.hash))
  const [usersTable] = await connection.query(`show tables like 'users'`)
  const schemaExists = usersTable.length > 0

  const plan = migrations.map((m) => ({
    migration: m,
    action: appliedHashes.has(m.hash)
      ? 'applied'
      : m.idx === journal.entries[0].idx && schemaExists
        ? 'baseline' // record as applied without executing
        : 'run',
  }))
  const pending = plan.filter((p) => p.action !== 'applied')

  // Preflight: every DROP target in migrations that will actually RUN must
  // exist on this DB, else the migration dies partway through.
  const missingTargets = []
  for (const { migration, action } of pending) {
    if (action !== 'run') continue
    for (const stmt of migration.statements) {
      for (const target of dropTargets(stmt)) {
        if (!(await dropTargetExists(connection, target))) {
          missingTargets.push({ tag: migration.tag, target })
        }
      }
    }
  }

  if (statusOnly) {
    console.log('')
    for (const { migration, action } of plan) {
      const label = {
        applied: '✓ applied',
        baseline:
          '○ pending — will be marked applied WITHOUT running (baseline; schema already exists)',
        run: '● pending — will RUN',
      }[action]
      console.log(`${migration.tag}  ${label}`)
      if (action === 'run') {
        for (const stmt of migration.statements) {
          console.log(stmt.replace(/^/gm, '    ') + '\n')
        }
        for (const stmt of destructiveStatements(migration)) {
          console.log(
            `    ⚠️  DESTRUCTIVE statement above: ${stmt.split('\n')[0].slice(0, 80)}`,
          )
        }
      }
    }
    const stale =
      rows.length - plan.filter((p) => p.action === 'applied').length
    if (stale > 0) {
      console.log(
        `\n(note: ${stale} recorded row(s) in ${TRACKING_TABLE} match no current migration file — historical, ignored)`,
      )
    }
    if (missingTargets.length > 0) {
      console.log(
        `\n❌ ${missingTargets.length} DROP target(s) do NOT exist on this database — these statements WILL FAIL:`,
      )
      for (const { tag, target } of missingTargets) {
        console.log(`    ${tag}: ${describeTarget(target)} not found`)
      }
      console.log(
        `\n   Most likely cause: drizzle generated a convention constraint name that this DB\n` +
          `   does not use (see docs/database-migrations.md). Check the real name with\n` +
          `   \`SHOW CREATE TABLE <table>\` and edit the migration SQL to match.\n` +
          `   \`npm run db:migrate\` will refuse to run until this is resolved.`,
      )
    }
    console.log(
      pending.length === 0
        ? '\nNothing to do — database is up to date.'
        : `\n${pending.length} migration(s) pending. Run \`npm run db:migrate\` to apply.`,
    )
  } else {
    if (missingTargets.length > 0) {
      console.error(
        `\n❌ Refusing to migrate: ${missingTargets.length} DROP target(s) do not exist on this database.`,
      )
      for (const { tag, target } of missingTargets) {
        console.error(`    ${tag}: ${describeTarget(target)} not found`)
      }
      console.error(
        `\nNothing was applied. Run \`npm run db:status\` for details.`,
      )
      await connection.end()
      process.exit(1)
    }
    if (pending.length === 0) {
      console.log('No pending migrations.')
    }
    for (const { migration, action } of pending) {
      if (action === 'baseline') {
        await connection.query(
          `insert into \`${TRACKING_TABLE}\` (hash, created_at) values (?, ?)`,
          [migration.hash, migration.when],
        )
        console.log(
          `${migration.tag}: existing schema — marked applied without running (baseline).`,
        )
        continue
      }
      const destructive = destructiveStatements(migration)
      if (destructive.length > 0) {
        console.log(
          `⚠️  ${migration.tag} contains ${destructive.length} destructive statement(s) — review with \`npm run db:status\` next time.`,
        )
      }
      for (const stmt of migration.statements) {
        await connection.query(stmt)
      }
      await connection.query(
        `insert into \`${TRACKING_TABLE}\` (hash, created_at) values (?, ?)`,
        [migration.hash, migration.when],
      )
      console.log(
        `${migration.tag}: applied (${migration.statements.length} statement(s)).`,
      )
    }
  }
} finally {
  await connection.end()
}
