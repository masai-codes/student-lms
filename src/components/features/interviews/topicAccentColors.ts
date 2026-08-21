/**
 * Cycles topic icon chips through the app's semantic "subtle" token pairs
 * (never raw palette colors — see styles.css's theming-system contract) so a
 * grid of topics reads with rhythm instead of one flat gray circle per card.
 * Index-based (not domain-based) because most students only ever see ONE
 * resolved domain at a time — domain-keyed color would make an entire grid
 * monochrome for the common case.
 */
const TOPIC_ACCENT_CLASSES = [
  'bg-brand-subtle text-brand-subtle-foreground',
  'bg-info-subtle text-info-subtle-foreground',
  'bg-success-subtle text-success-subtle-foreground',
  'bg-warning-subtle text-warning-subtle-foreground',
] as const

export function getTopicAccentClassName(index: number): string {
  return TOPIC_ACCENT_CLASSES[index % TOPIC_ACCENT_CLASSES.length]
}
