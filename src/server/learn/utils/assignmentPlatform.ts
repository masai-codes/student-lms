const ASSESSMENT_PLATFORMS = new Set([
  'assessment platform',
  'assessment platform - ai interview',
])

export function isAssessmentPlatform(platform: string | null | undefined): boolean {
  if (platform == null || platform.trim() === '') return false
  return ASSESSMENT_PLATFORMS.has(platform.trim().toLowerCase())
}

export function readAssignmentSettingsCase(
  settings: Record<string, unknown> | null | undefined,
): string {
  if (settings == null || typeof settings !== 'object') return ''
  const value = settings.case
  return typeof value === 'string' ? value : ''
}

export function readAssignmentSettingsFlag(
  settings: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  if (settings == null || typeof settings !== 'object') return false
  return settings[key] === true
}
