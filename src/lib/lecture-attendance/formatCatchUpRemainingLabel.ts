/**
 * Single source for the catch-up "time left" label shown alongside attendance
 * badges (lecture cards, lecture detail header, and its hover tooltip).
 *
 * Prefers the granular server-computed label (e.g. "28 days remaining", built
 * from {@link formatTimeRemaining}); falls back to the whole-day integer only
 * when that label is absent. Keeping this in one place ensures every surface
 * shows the exact same countdown text.
 */
export function formatCatchUpRemainingLabel(
  remainingLabel: string | null,
  daysRemaining: number | null,
): string | null {
  if (remainingLabel) return remainingLabel
  if (daysRemaining != null && daysRemaining >= 0) {
    return `${daysRemaining} days remaining`
  }
  return null
}
