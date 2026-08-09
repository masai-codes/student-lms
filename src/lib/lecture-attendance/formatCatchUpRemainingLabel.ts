/**
 * Single source for the catch-up "time left" label shown alongside attendance
 * badges (lecture cards, lecture detail header, and its hover tooltip).
 *
 * Renders the whole-day count computed by `computeCatchUpWindow` — the same
 * number and wording the legacy LMS shows. Keeping this in one place ensures
 * every surface shows the exact same countdown text.
 */
export function formatCatchUpRemainingLabel(
  daysRemaining: number | null,
): string | null {
  if (daysRemaining != null && daysRemaining >= 0) {
    return `${daysRemaining} days remaining`
  }
  return null
}
