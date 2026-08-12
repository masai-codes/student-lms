export { ThemeProvider, useTheme } from './ThemeProvider'
export { buildThemeInitScript } from './theme-script'
export {
  applyThemeToDocument,
  getSystemTheme,
  readStoredPreference,
} from './apply'
export {
  DEFAULT_PREFERENCE,
  RESOLVED_THEMES,
  STORAGE_KEY,
  isResolvedTheme,
  isThemePreference,
  preferenceForExplicitPick,
  resolveTheme,
} from './themes'
export type { ResolvedTheme, ThemePreference } from './themes'
