/**
 * Picks the singular or plural word for a count. Plural defaults to
 * `singular + "s"`, so `pluralize(1, 'member')` → "member" and
 * `pluralize(3, 'member')` → "members".
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural
}

/**
 * Formats a member count with its correctly-pluralised label, e.g.
 * `1 member`, `234 members`. Uses the Indian digit grouping used across the app.
 */
export function formatMemberCount(count: number): string {
  return `${count.toLocaleString('en-IN')} ${pluralize(count, 'member')}`
}
