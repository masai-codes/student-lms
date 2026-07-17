/**
 * Sync `src/db/schema.ts` from the DB and reapply the timezone-safe column types.
 *
 * Run AFTER `drizzle-kit pull` (which regenerates ./drizzle/schema.ts from the
 * live DB, filtered by the manual allowlist in `src/db/managedTables.ts`). This
 * makes ./src/db/schema.ts a PURE derivative of the DB dump for managed tables:
 *
 *   - `src/db/managedTables.ts` is the allowlist (edit by hand). Only those SQL
 *     table names are pulled and written into schema.ts.
 *   - Extra tables in the DB are never added. Tables removed from the allowlist
 *     are dropped from schema.ts on the next sync.
 *   - the stock `datetime`/`timestamp` imports are swapped for `istDatetime` /
 *     `utcTimestamp` from ./columnTypes. All `datetime(...)` / `timestamp(...)`
 *     call sites resolve to the wrappers via the aliased import, so no table body
 *     is edited.
 *   - `npm run db:sync` runs Prettier on the result so sync does not create
 *     format-only diffs.
 *
 * The transient dump (./drizzle/schema.ts) is deleted afterwards so only ONE
 * schema file — ./src/db/schema.ts — ever exists on disk. Drizzle's migration
 * meta (./drizzle/meta) and generated SQL are untouched.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DUMP = path.join(root, 'drizzle', 'schema.ts')
const OUT = path.join(root, 'src', 'db', 'schema.ts')
const MANAGED_TABLES_FILE = path.join(root, 'src', 'db', 'managedTables.ts')

const COLUMN_TYPES_IMPORT = [
  '// Timezone-safe replacements for `datetime` (IST wall-clock) and `timestamp`',
  '// (UTC). Reads return offset-stamped ISO strings so no call site has to know',
  '// the convention. See ./columnTypes for details.',
  'import { istDatetime as datetime, utcTimestamp as timestamp } from "./columnTypes"',
].join('\n')

/**
 * `drizzle-kit pull` emits MySQL backtick-quoted identifiers INSIDE a
 * `sql`...`` template without escaping them, which prematurely closes the JS
 * template literal and breaks compilation (e.g. `votes.voteTarget`). Escape any
 * backtick that sits between the opening ``sql` `` and the final backtick on the
 * same line, leaving the template delimiters intact.
 */
function escapeSqlTemplateBackticks(src) {
  const OPEN = 'sql`'
  return src
    .split('\n')
    .map((line) => {
      const open = line.indexOf(OPEN)
      if (open === -1) return line
      const openTick = open + OPEN.length - 1 // index of the opening backtick
      const closeTick = line.lastIndexOf('`')
      if (closeTick <= openTick) return line // no closing backtick on this line
      const before = line.slice(0, openTick + 1)
      const inner = line.slice(openTick + 1, closeTick).replace(/`/g, '\\`')
      const after = line.slice(closeTick)
      return before + inner + after
    })
    .join('\n')
}

/**
 * Reconcile the raw pull output with our custom column types and the type
 * refinements the app relies on. All mechanical, all reapplied on every sync:
 *
 *   1. `.default((someFunc()))` — pull sometimes emits an unwrapped SQL-function
 *      default; wrap it in `sql`...`` so it compiles.
 *   2. `.defaultNow()` / `.onUpdateNow()` — the `customType`-based datetime types
 *      have neither. `.defaultNow()` becomes `.default(sql`CURRENT_TIMESTAMP`)`;
 *      `.onUpdateNow()` is dropped (MySQL manages `ON UPDATE CURRENT_TIMESTAMP`).
 *   3. `json(...)` columns get `.$type<Record<string, any>>()` — pull infers them
 *      as `unknown`, which breaks every `row.jsonCol.someKey` access. The old
 *      hand-tuned schema typed all 39 of them this exact way.
 */
function reconcileCustomTypes(src) {
  return src
    .replace(/\.default\(\((\w+\([^)]*\))\)\)/g, '.default(sql`($1)`)')
    .replace(/\.defaultNow\(\)/g, '.default(sql`CURRENT_TIMESTAMP`)')
    .replace(/\.onUpdateNow\(\)/g, '')
    .replace(
      /\bjson\(([^)]*)\)(?!\.\$type)/g,
      'json($1).$type<Record<string, any>>()',
    )
}

/** Split a schema file into a Map<tableName, blockText>, preserving order. */
function parseTableBlocks(src) {
  const map = new Map()
  const re = /export const \w+ = mysqlTable\("([^"]+)"/g
  const starts = []
  let m
  while ((m = re.exec(src)) !== null) starts.push({ idx: m.index, table: m[1] })
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].idx
    const end = i + 1 < starts.length ? starts[i + 1].idx : src.length
    map.set(starts[i].table, src.slice(start, end).trimEnd())
  }
  return map
}

/** Load the hand-maintained SQL table allowlist from `managedTables.ts`. */
function loadManagedTables() {
  if (!existsSync(MANAGED_TABLES_FILE)) {
    console.error(
      `[sync-schema] missing allowlist: ${MANAGED_TABLES_FILE}. Create it with MANAGED_TABLES = [...].`,
    )
    process.exit(1)
  }
  const src = readFileSync(MANAGED_TABLES_FILE, 'utf8')
  const match = src.match(
    /export const MANAGED_TABLES\s*=\s*\[([\s\S]*?)\]\s*as const/,
  )
  if (!match) {
    console.error(
      '[sync-schema] could not parse MANAGED_TABLES from src/db/managedTables.ts.',
    )
    process.exit(1)
  }
  const tables = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
  if (tables.length === 0) {
    console.error(
      '[sync-schema] MANAGED_TABLES is empty — add the SQL tables this app uses, then re-run.',
    )
    process.exit(1)
  }
  return tables
}

function parseCoreNames(block) {
  return block
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

if (!existsSync(DUMP)) {
  console.error(
    `[sync-schema] dump not found: ${DUMP}. Run \`drizzle-kit pull\` first.`,
  )
  process.exit(1)
}

const allowlist = loadManagedTables()
const dump = readFileSync(DUMP, 'utf8')
const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''

const dumpBlocks = parseTableBlocks(dump)
if (dumpBlocks.size === 0) {
  console.error(
    "[sync-schema] dump has 0 tables — aborting so we don't clobber src/db/schema.ts.",
  )
  process.exit(1)
}

const previousBlocks = parseTableBlocks(previous)
const missingFromDb = []
const skippedFromDump = []
const selectedBlocks = []

for (const table of allowlist) {
  if (dumpBlocks.has(table)) {
    selectedBlocks.push(dumpBlocks.get(table))
  } else if (previousBlocks.has(table)) {
    missingFromDb.push(table)
    selectedBlocks.push(previousBlocks.get(table))
  } else {
    missingFromDb.push(table)
    console.error(
      `[sync-schema] ⚠ managed table "${table}" not in DB dump and not in previous schema — skipped.`,
    )
  }
}

for (const table of dumpBlocks.keys()) {
  if (!allowlist.includes(table)) skippedFromDump.push(table)
}

const droppedFromSchema = [...previousBlocks.keys()].filter(
  (t) => !allowlist.includes(t),
)

const body = reconcileCustomTypes(
  escapeSqlTemplateBackticks(selectedBlocks.join('\n\n')),
)

const coreMatch = dump.match(
  /import\s*\{([^}]*)\}\s*from\s*["']drizzle-orm\/mysql-core["']/,
)
if (!coreMatch) {
  console.error(
    '[sync-schema] could not locate the drizzle-orm/mysql-core import in the dump.',
  )
  process.exit(1)
}
const previousCoreMatch = previous.match(
  /import\s*\{([^}]*)\}\s*from\s*["']drizzle-orm\/mysql-core["']/,
)
const coreNames = [
  ...new Set([
    ...parseCoreNames(coreMatch[1]),
    ...(previousCoreMatch ? parseCoreNames(previousCoreMatch[1]) : []),
  ]),
]
  .filter((n) => n !== 'datetime' && n !== 'timestamp')
  .filter((n) => new RegExp(`\\b${n}\\b`).test(body))

const usesSql = /\bsql\b/.test(body)

const header = [
  'import {',
  ...coreNames.map((n) => `  ${n},`),
  '} from "drizzle-orm/mysql-core"',
  ...(usesSql ? ['import { sql } from "drizzle-orm"'] : []),
  COLUMN_TYPES_IMPORT,
].join('\n')

writeFileSync(OUT, `${header}\n\n${body}\n`, 'utf8')

try {
  unlinkSync(DUMP)
} catch {
  /* best-effort cleanup */
}

console.error(
  `[sync-schema] wrote ${OUT} (${allowlist.length - missingFromDb.length}/${allowlist.length} managed tables from DB)`,
)
if (missingFromDb.length) {
  console.error(
    `[sync-schema] ⚠ ${missingFromDb.length} managed table(s) missing from dump: ${missingFromDb.join(', ')}`,
  )
}
if (droppedFromSchema.length) {
  console.error(
    `[sync-schema] dropped ${droppedFromSchema.length} table(s) no longer in MANAGED_TABLES: ${droppedFromSchema.join(', ')}`,
  )
}
if (skippedFromDump.length) {
  console.error(
    `[sync-schema] skipped ${skippedFromDump.length} dump table(s) not in MANAGED_TABLES: ${skippedFromDump.join(', ')}`,
  )
}
