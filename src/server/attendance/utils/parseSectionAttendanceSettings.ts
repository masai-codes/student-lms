export type SectionAttendanceSettings = {
  enableVideoAttendance: boolean
  catchUpDays: number
}

export function parseSectionAttendanceSettings(
  settingsRaw: unknown,
): SectionAttendanceSettings {
  let settings: Record<string, unknown> = {}

  if (typeof settingsRaw === 'string') {
    try {
      settings = JSON.parse(settingsRaw) as Record<string, unknown>
    } catch {
      settings = {}
    }
  } else if (settingsRaw != null && typeof settingsRaw === 'object') {
    settings = settingsRaw as Record<string, unknown>
  }

  const enableVideoAttendance =
    settings.enableVideoAttendance === true ||
    settings.considerVideoAttendanceForActualAttendance === true

  const catchUpDaysFromSettings = Number(settings.catchUpDays)
  const catchUpDays =
    Number.isFinite(catchUpDaysFromSettings) && catchUpDaysFromSettings > 0
      ? catchUpDaysFromSettings
      : 0

  return { enableVideoAttendance, catchUpDays }
}
