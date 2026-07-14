import type { AccentColor } from './types'

/**
 * Accent color hex values, applied via inline styles (data-driven colors
 * can't be JIT-compiled as Tailwind arbitrary classes).
 */
export const ACCENT_STYLES: Record<
  AccentColor,
  { iconBg: string; value: string }
> = {
  orange: {
    iconBg: 'color-mix(in srgb, var(--color-masaiverse-orange) 15%, white)',
    value: 'var(--color-masaiverse-orange)',
  },
  green: { iconBg: '#E3F3E8', value: '#2E7D46' },
  purple: { iconBg: '#EDE6F8', value: '#6D28D9' },
  blue: { iconBg: '#E6EEFB', value: '#2563EB' },
}
