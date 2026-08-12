import type { AccentColor } from './types'

/**
 * Accent color values, applied via inline styles (data-driven colors can't be
 * JIT-compiled as Tailwind arbitrary classes). Themed without classes:
 * `light-dark()` resolves per the active `color-scheme` (set by the theme
 * blocks in styles.css) — light values are byte-identical to the originals;
 * dark values are the same-hue washes/pastels used by DiscussionTags. The
 * orange pair rides the `--accent-warm` / `--surface` tokens directly.
 */
export const ACCENT_STYLES: Record<
  AccentColor,
  { iconBg: string; value: string }
> = {
  orange: {
    iconBg: 'color-mix(in srgb, var(--accent-warm) 15%, var(--surface))',
    value: 'var(--accent-warm)',
  },
  green: {
    iconBg: 'light-dark(#E3F3E8, rgb(46 125 70 / 0.25))',
    value: 'light-dark(#2E7D46, #7FD6A0)',
  },
  purple: {
    iconBg: 'light-dark(#EDE6F8, rgb(109 40 217 / 0.25))',
    value: 'light-dark(#6D28D9, #C4A8F5)',
  },
  blue: {
    iconBg: 'light-dark(#E6EEFB, rgb(37 99 235 / 0.20))',
    value: 'light-dark(#2563EB, #8FB4F9)',
  },
}
