#!/usr/bin/env node
/**
 * Theme contrast validator.
 *
 * Parses the theme token blocks in `src/styles.css`, then checks that every
 * foreground/background PAIR meets a minimum WCAG contrast ratio, for EVERY
 * theme. This is the guardrail behind the theming system's core promise: a
 * theme physically cannot ship with an unreadable combination.
 *
 * Policy:
 *   • text  → 4.5:1  (WCAG AA, normal text)   — hard fail
 *   • ui    → 3.0:1  (WCAG AA, UI components / large bold text like buttons,
 *                      badges, status chips) — hard fail
 *   • hint  → 3.0:1  (intentionally low-emphasis placeholder/hint colors)
 *                      — warn only, never fails the build
 *
 * No dependencies — hex and oklch are converted to relative luminance inline.
 * Run: `node scripts/check-contrast.mjs`
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSS_PATH = join(__dirname, '..', 'src', 'styles.css')

const THEME_IDS = ['light', 'dark']

/** [foreground token, background token, category] */
const PAIRS = [
  ['foreground', 'background', 'text'],
  ['foreground-muted', 'background', 'text'],
  ['foreground-subtle', 'background', 'hint'],
  ['surface-foreground', 'surface', 'text'],
  ['surface-muted-foreground', 'surface-muted', 'text'],
  ['card-foreground', 'card', 'text'],
  ['popover-foreground', 'popover', 'text'],
  ['muted-foreground', 'muted', 'text'],
  ['secondary-foreground', 'secondary', 'text'],
  ['accent-foreground', 'accent', 'text'],
  ['brand-subtle-foreground', 'brand-subtle', 'text'],
  ['sidebar-foreground', 'sidebar', 'text'],
  ['sidebar-accent-foreground', 'sidebar-accent', 'text'],
  ['success-subtle-foreground', 'success-subtle', 'text'],
  ['warning-subtle-foreground', 'warning-subtle', 'text'],
  ['danger-subtle-foreground', 'danger-subtle', 'text'],
  ['info-subtle-foreground', 'info-subtle', 'text'],

  ['primary-foreground', 'primary', 'ui'],
  ['brand-foreground', 'brand', 'ui'],
  ['accent-warm-foreground', 'accent-warm', 'ui'],
  ['destructive-foreground', 'destructive', 'ui'],
  ['sidebar-primary-foreground', 'sidebar-primary', 'ui'],
  ['success-foreground', 'success', 'ui'],
  ['warning-foreground', 'warning', 'ui'],
  ['danger-foreground', 'danger', 'ui'],
  ['info-foreground', 'info', 'ui'],
]

const MIN = { text: 4.5, ui: 3.0, hint: 3.0 }

/**
 * Documented baseline exceptions, keyed `theme:fg:bg` → relaxed minimum.
 * These are pre-existing shadcn defaults retained so LMS Default stays
 * byte-identical to the app as it shipped. New themes get no exceptions.
 */
const EXCEPTIONS = {
  // shadcn's stock secondary-text-on-muted-fill (oklch .556 on .97) = 4.34:1.
  'light:muted-foreground:muted': 4.3,
}

// ── color math ────────────────────────────────────────────────────────────

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function hexLuminance(hex) {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function oklchLuminance(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  // oklab → LINEAR sRGB (already linear; feed straight into the luminance sum)
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  const clamp = (x) => Math.min(1, Math.max(0, x))
  return 0.2126 * clamp(R) + 0.7152 * clamp(G) + 0.0722 * clamp(B)
}

function luminance(value) {
  const v = value.trim()
  if (v.startsWith('#')) return hexLuminance(v)
  const m = v.match(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/i)
  if (m) return oklchLuminance(+m[1], +m[2], +m[3])
  throw new Error(`Unsupported color format: ${value}`)
}

function contrast(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ── parse styles.css ────────────────────────────────────────────────────────

function extractBlock(css, themeId) {
  // Anchor to the selector at line start so mentions of the attribute inside
  // comments can't be mistaken for the block itself.
  const marker = `\n[data-theme='${themeId}'] {`
  const idx = css.indexOf(marker)
  if (idx === -1) throw new Error(`Theme block not found: ${themeId}`)
  const open = css.indexOf('{', idx)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const tokens = {}
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*--([a-z0-9-]+)\s*:\s*(.+?);/i)
    if (m) tokens[m[1]] = m[2].trim()
  }
  return tokens
}

// ── run ─────────────────────────────────────────────────────────────────────

const css = readFileSync(CSS_PATH, 'utf8')
let failures = 0
let warnings = 0

for (const themeId of THEME_IDS) {
  const tokens = extractBlock(css, themeId)
  const problems = []
  for (const [fgKey, bgKey, cat] of PAIRS) {
    const fg = tokens[fgKey]
    const bg = tokens[bgKey]
    if (!fg || !bg) {
      problems.push(`  MISSING  ${fgKey} on ${bgKey} (token not defined)`)
      failures++
      continue
    }
    const ratio = contrast(fg, bg)
    const min = EXCEPTIONS[`${themeId}:${fgKey}:${bgKey}`] ?? MIN[cat]
    if (ratio < min) {
      const line = `  ${ratio.toFixed(2)}:1  ${fgKey} on ${bgKey}  (need ${min}, ${cat})`
      if (cat === 'hint') {
        problems.push(`  WARN   ${line.trim()}`)
        warnings++
      } else {
        problems.push(`  FAIL   ${line.trim()}`)
        failures++
      }
    }
  }
  if (problems.length === 0) {
    console.log(`✓ ${themeId} — all ${PAIRS.length} pairs pass`)
  } else {
    console.log(`• ${themeId}`)
    for (const p of problems) console.log(p)
  }
}

console.log('')
if (failures > 0) {
  console.error(
    `✗ Contrast check FAILED: ${failures} issue(s), ${warnings} warning(s).`,
  )
  process.exit(1)
}
console.log(`✓ Contrast check passed (${warnings} warning(s)).`)
