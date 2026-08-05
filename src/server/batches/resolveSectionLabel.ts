/**
 * The section label to show learners: `sections.settings.sectionDisplayName`
 * when set, else the raw `sections.name` (which is a cohort *code* such as
 * `IITREICT_AIML_2604_M1_101`). Ops set the display name so students see a
 * friendly label instead of the code.
 *
 * The legacy LMS applies the same fallback (`experience-api`
 * `assignment.controller.ts`, `experience-ui` `SectionPhase.tsx`), so keep the
 * two in sync.
 *
 * `settings` is free-form JSON, so the display name is defensively narrowed and
 * trimmed — a blank/whitespace-only value falls back to the name.
 */
export function resolveSectionLabel(
  name: string | null | undefined,
  settings: unknown,
): string {
  return resolveSectionDisplayName(settings) || (name ?? '')
}

/**
 * The trimmed `sectionDisplayName` from a `sections.settings` JSON blob, or `''`
 * when absent/blank. Use {@link resolveSectionLabel} unless you already have the
 * display name split out from the name (e.g. raw SQL projections).
 */
export function resolveSectionDisplayName(settings: unknown): string {
  if (!settings || typeof settings !== 'object') return ''
  const value = (settings as { sectionDisplayName?: unknown })
    .sectionDisplayName
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Same as {@link resolveSectionLabel} for raw-SQL rows that project the display
 * name via `settings->>'$.sectionDisplayName'`. MySQL's `->>` yields the literal
 * string `'null'` for a JSON null, so that sentinel is treated as absent.
 */
export function resolveSectionLabelFromColumns(
  name: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const trimmed = typeof displayName === 'string' ? displayName.trim() : ''
  return trimmed && trimmed !== 'null' ? trimmed : (name ?? '')
}
