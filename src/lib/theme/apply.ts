import { DEFAULT_PREFERENCE, isThemePreference } from './themes'
import type { ResolvedTheme, ThemePreference } from './themes'

/**
 * Apply a resolved theme to `<html>`: set `data-theme`, toggle `.dark` (so
 * `dark:` utilities flip), and set `color-scheme` (native scrollbars, form
 * controls, and UA default colors). The pre-hydration inline script (see
 * `theme-script.ts`) mirrors this exact logic in plain string form so there is
 * no flash of the wrong theme.
 */
export function applyThemeToDocument(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

/** Read the persisted preference from localStorage, falling back to `system`. */
export function readStoredPreference(storageKey: string): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCE
  try {
    const raw = window.localStorage.getItem(storageKey)
    return isThemePreference(raw) ? raw : DEFAULT_PREFERENCE
  } catch {
    return DEFAULT_PREFERENCE
  }
}

/** The OS-level color scheme right now (light on the server). */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
