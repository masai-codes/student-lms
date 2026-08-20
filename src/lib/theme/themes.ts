/**
 * Theme model — exactly two themes exist: `light` and `dark`.
 *
 * The color values live in `src/styles.css`:
 *   • `:root, [data-theme='light']`  — light tokens
 *   • `.dark, [data-theme='dark']`   — dark tokens
 *
 * What we persist is the user's PREFERENCE, not the resolved theme:
 *   • `system` (default) — follow the OS via `prefers-color-scheme`
 *   • `light` / `dark`   — an explicit pin
 *
 * Collapse-to-system rule: when the user toggles to a mode that matches the
 * current OS preference, we store `system` instead of the explicit mode, so a
 * later OS-level switch carries the app along automatically.
 */

/** A concrete, renderable theme. */
export type ResolvedTheme = 'light' | 'dark'

/** What we persist: an explicit theme or "follow the OS". */
export type ThemePreference = ResolvedTheme | 'system'

const RESOLVED_THEMES: Array<ResolvedTheme> = ['light', 'dark']

export const DEFAULT_PREFERENCE: ThemePreference = 'system'

export const STORAGE_KEY = 'masai-lms-theme'

function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === 'light' || value === 'dark'
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || isResolvedTheme(value)
}

/** Resolve a preference against the current system mode. */
export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference
}

/**
 * The preference to persist when the user explicitly picks `mode`: collapses
 * to `system` when the pick matches the OS, so the app keeps following the OS.
 */
export function preferenceForExplicitPick(
  mode: ResolvedTheme,
  systemTheme: ResolvedTheme,
): ThemePreference {
  return mode === systemTheme ? 'system' : mode
}
