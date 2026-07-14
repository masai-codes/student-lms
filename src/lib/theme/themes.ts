/**
 * Theme registry — the single source of truth for which themes exist.
 *
 * Each entry is pure metadata. The actual color values live in
 * `src/styles.css` under a matching `[data-theme='<id>']` block. To add a
 * theme: add a token block in styles.css AND an entry here. Nothing else.
 *
 * `swatch` is a small set of representative hex values used to render the
 * preview dots in the switcher; keep them in sync with the theme's real
 * background / surface / brand / accent tokens.
 */

export type ThemeMode = 'light' | 'dark'

export type ThemeId =
  'lms-default' | 'midnight' | 'cocoa' | 'masaiverse' | 'blossom' | 'anthropic'

export interface ThemeDefinition {
  id: ThemeId
  /** Human label shown in the switcher. */
  label: string
  /** One-line description shown under the label. */
  description: string
  /** Drives whether the provider also adds the `.dark` class to <html>. */
  mode: ThemeMode
  /**
   * `stable` themes are fully migrated and safe everywhere. `preview` themes
   * work against tokenized surfaces but may show light-mode islands until the
   * Phase B token migration completes; the switcher flags them.
   */
  stability: 'stable' | 'preview'
  /** [background, surface, brand, accent] — for the preview swatch dots. */
  swatch: [string, string, string, string]
}

export const DEFAULT_THEME_ID: ThemeId = 'lms-default'

export const THEMES: Array<ThemeDefinition> = [
  {
    id: 'lms-default',
    label: 'LMS Default',
    description: 'The classic Masai look — clean, bright, familiar.',
    mode: 'light',
    stability: 'stable',
    swatch: ['#ffffff', '#f9fafb', '#6962ac', '#f25c04'],
  },
  {
    id: 'masaiverse',
    label: 'Masaiverse',
    description: 'Warm, energetic orange. Pure Masai brand heat.',
    mode: 'light',
    stability: 'preview',
    swatch: ['#fff8f1', '#ffffff', '#f25c04', '#d03801'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Soft warm cream and clay. Calm, editorial, cozy.',
    mode: 'light',
    stability: 'preview',
    swatch: ['#f5f1ea', '#fbf9f5', '#c15f3c', '#d97757'],
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Playful, cute pink. Light and delightful.',
    mode: 'light',
    stability: 'preview',
    swatch: ['#fff5f9', '#ffffff', '#e74694', '#d61f69'],
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep indigo dark mode. Focused and modern.',
    mode: 'dark',
    stability: 'preview',
    swatch: ['#0b0f1a', '#131a2b', '#8da2fb', '#fb8a4c'],
  },
  {
    id: 'cocoa',
    label: 'Cocoa',
    description: 'Warm brown dark mode. Rich and easy on the eyes.',
    mode: 'dark',
    stability: 'preview',
    swatch: ['#1a1310', '#241a15', '#e8a87c', '#f2994a'],
  },
]

const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]))

export const THEME_IDS = THEMES.map((t) => t.id)

export const STORAGE_KEY = 'masai-lms-theme'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_BY_ID.has(value as ThemeId)
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEME_BY_ID.get(id) ?? THEME_BY_ID.get(DEFAULT_THEME_ID)!
}
