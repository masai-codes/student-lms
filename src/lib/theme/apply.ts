import { DEFAULT_THEME_ID, THEMES, isThemeId } from './themes'
import type { ThemeId } from './themes'

/** Theme ids that also need the `.dark` class so `dark:` utilities flip. */
export const DARK_THEME_IDS: Array<ThemeId> = THEMES.filter(
  (t) => t.mode === 'dark',
).map((t) => t.id)

/**
 * Apply a theme to `<html>`: set `data-theme` and toggle `.dark`. Shared by the
 * runtime provider. The pre-hydration inline script (see `theme-script.ts`)
 * mirrors this exact logic in plain string form so there is no flash.
 */
export function applyThemeToDocument(id: ThemeId): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = id
  root.classList.toggle('dark', DARK_THEME_IDS.includes(id))
}

/** Read the persisted theme from localStorage, falling back to the default. */
export function readStoredTheme(storageKey: string): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID
  try {
    const raw = window.localStorage.getItem(storageKey)
    return isThemeId(raw) ? raw : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}
