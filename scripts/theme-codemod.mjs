#!/usr/bin/env node
/**
 * Phase B theming codemod — rewrites the SAFE, default-preserving subset of
 * hardcoded color utilities to semantic tokens (see docs/theming-token-map.md).
 *
 * Only deterministic 1:1 mappings whose lms-default token value equals the
 * original color are included here. Judgment cases (white/black on fills,
 * masaiverse orange, indigo accent, gradients, charts) are intentionally NOT
 * handled — those are migrated by hand / agents.
 *
 * Boundary-aware: a key only matches as a whole utility token (optionally with
 * a variant prefix like `hover:` and an opacity suffix like `/80`), so
 * `gray-50` never eats `gray-500`.
 *
 * Usage:
 *   node scripts/theme-codemod.mjs --dry   # preview counts, write nothing
 *   node scripts/theme-codemod.mjs         # apply
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'src')
const DRY = process.argv.includes('--dry')

// ── mapping table (order-independent; matching is boundary-aware) ────────────
const NEUTRAL_TEXT_FG = [
  'gray-900',
  'gray-800',
  'gray-700',
  'slate-900',
  'slate-800',
  '[#111827]',
  '[#111928]',
  '[#1F2A37]',
  '[#1F2937]',
  '[#374151]',
]
const NEUTRAL_TEXT_MUTED = [
  'gray-600',
  'gray-500',
  'slate-600',
  'slate-500',
  '[#4B5563]',
  '[#6B7280]',
]
const NEUTRAL_TEXT_SUBTLE = [
  'gray-400',
  'gray-300',
  'slate-400',
  '[#9CA3AF]',
  '[#D1D5DB]',
]
const BORDER = [
  'gray-200',
  'gray-100',
  'slate-200',
  '[#E5E7EB]',
  '[#EDEAE8]',
  '[#E0D9D3]',
]
const BORDER_STRONG = ['gray-300', '[#D1D5DB]']
const SURFACE_MUTED_BG = [
  'gray-50',
  'gray-100',
  'slate-50',
  'slate-100',
  '[#F9FAFB]',
  '[#F3F4F6]',
]
const MUTED_BG = ['gray-200', '[#E5E7EB]']
// Masai brand purple family
const BRAND = [
  '[#6962AC]',
  '[#6962ac]',
  '[#60599D]',
  '[#60599d]',
  '[#5B52A3]',
  '[#5B52a3]',
  '[#585196]',
  '[#564E97]',
  '[#564e97]',
  '[#5C56A0]',
  '[#5c56a0]',
  '[#554F8B]',
  '[#554f8b]',
  '[#5B478B]',
  '[#5b478b]',
  '[#4B44A8]',
  '[#3D379A]',
  '[#3d379a]',
  '[#6C63B8]',
  '[#6E66B8]',
  '[#6e66b8]',
]
const BRAND_SUBTLE_BG = ['[#F0EFF7]', '[#f0eff7]', '[#F7F6FF]', '[#f7f6ff]']
const DANGER_TEXT = [
  'red-700',
  'red-600',
  '[#DC2626]',
  '[#B71C2B]',
  '[#DC3545]',
]
const DANGER_BG = ['[#F05252]', 'red-500', '[#EF4444]', '[#ED0331]']
const SUCCESS_TEXT = ['green-700', 'green-600', '[#0d930f]']

/** Build the flat list of {from, to} utility rewrites for a set of props. */
function forProps(props, values, token) {
  const out = []
  for (const p of props)
    for (const v of values) out.push([`${p}-${v}`, `${p}-${token}`])
  return out
}

const MAP = [
  ...forProps(['text'], NEUTRAL_TEXT_FG, 'foreground'),
  ...forProps(['text'], NEUTRAL_TEXT_MUTED, 'foreground-muted'),
  ...forProps(['text'], NEUTRAL_TEXT_SUBTLE, 'foreground-subtle'),
  ...forProps(['border', 'divide'], BORDER, 'border'),
  ...forProps(['border'], BORDER_STRONG, 'border-strong'),
  ...forProps(['bg'], SURFACE_MUTED_BG, 'surface-muted'),
  ...forProps(['bg'], MUTED_BG, 'muted'),
  ['bg-white', 'bg-surface'],
  ...forProps(
    ['text', 'bg', 'border', 'ring', 'fill', 'stroke'],
    BRAND,
    'brand',
  ),
  ...forProps(['bg'], BRAND_SUBTLE_BG, 'brand-subtle'),
  ...forProps(['text', 'fill'], DANGER_TEXT, 'danger'),
  ...forProps(['bg'], DANGER_BG, 'danger'),
  ...forProps(['text', 'fill'], SUCCESS_TEXT, 'success'),
]

// De-dupe (case variants of the same hex can collide after lowercasing keys).
const seen = new Set()
const RULES = MAP.filter(([from]) => {
  if (seen.has(from)) return false
  seen.add(from)
  return true
}).map(([from, to]) => {
  const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Whole-token: preceded by start/space/quote/brace/paren/colon(variant),
  // followed by end/space/quote/brace/paren or an opacity `/`.
  return {
    re: new RegExp(`(?<=^|[\\s:'"\`{(])${esc}(?=$|[\\s'"\`)}]|/)`, 'g'),
    to,
    from,
  }
})

// ── walk src ────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules') continue
      walk(full, acc)
    } else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(SRC)
let changedFiles = 0
let totalRepl = 0
const perRule = {}

for (const file of files) {
  const orig = readFileSync(file, 'utf8')
  let next = orig
  for (const { re, to, from } of RULES) {
    next = next.replace(re, () => {
      perRule[from] = (perRule[from] || 0) + 1
      totalRepl++
      return to
    })
  }
  if (next !== orig) {
    changedFiles++
    if (!DRY) writeFileSync(file, next)
  }
}

console.log(
  `${DRY ? '[dry] ' : ''}${totalRepl} replacements across ${changedFiles} files (of ${files.length} scanned).`,
)
const top = Object.entries(perRule).sort((a, b) => b[1] - a[1])
for (const [from, n] of top.slice(0, 30))
  console.log(`  ${n.toString().padStart(4)}  ${from}`)
if (top.length > 30) console.log(`  … and ${top.length - 30} more rules`)
