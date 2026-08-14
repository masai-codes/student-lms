/**
 * Shortens constraint names longer than MySQL's 64-char identifier limit in
 * generated migration SQL.
 *
 * Needed because `drizzle-kit pull` writes FKs as inline `.references()`
 * (dropping the DB's original constraint names), so `drizzle-kit generate`
 * invents `<table>_<col>_<reftable>_<refcol>_fk` names that can exceed 64
 * chars and make MySQL reject the statement (ER_TOO_LONG_IDENT).
 *
 * Replacement is deterministic — first 55 chars + 8-char sha256 of the full
 * name — so re-running never changes an already-fixed file.
 *
 * Runs as part of `npm run db:generate` on every .sql file in ./drizzle
 * (already-applied files are never touched in a way that changes them, since
 * the fix is idempotent and long names can never have been applied).
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const MAX = 64
const dir = resolve(process.cwd(), 'drizzle')

const shorten = (name) =>
  name.length <= MAX
    ? name
    : name.slice(0, 55) +
      '_' +
      createHash('sha256').update(name).digest('hex').slice(0, 8)

for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
  const path = resolve(dir, file)
  const src = readFileSync(path, 'utf8')
  let changed = 0
  const out = src.replace(/(CONSTRAINT `)([^`]+)(`)/g, (m, pre, name, post) => {
    const short = shorten(name)
    if (short !== name) changed++
    return pre + short + post
  })
  if (changed > 0) {
    writeFileSync(path, out)
    console.log(`[fix-identifiers] ${file}: shortened ${changed} name(s)`)
  }
}
