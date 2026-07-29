/**
 * Reads `assignments.settings.weightagePercentage` (the old LMS writes it there
 * as a number, occasionally as a numeric string). Returns null when unset, not
 * numeric, or non-positive — a 0% weightage carries no information for the
 * learner, so it renders no chip.
 */
export function resolveAssignmentWeightage(settings: unknown): number | null {
  if (settings == null || typeof settings !== 'object') {
    return null
  }
  const raw = (settings as Record<string, unknown>)['weightagePercentage']
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw)
        : Number.NaN
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Chip/badge copy for a resolved weightage, e.g. `10% Weightage`. */
export function formatAssignmentWeightageLabel(weightage: number): string {
  return `${weightage}% Weightage`
}
